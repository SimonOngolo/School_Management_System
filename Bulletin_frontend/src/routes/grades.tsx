import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui-kit";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Save, Loader2, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { StudentSearch } from "@/components/StudentSearch";

export const Route = createFileRoute("/grades")({
  component: () => <ProtectedRoute><GradesPage /></ProtectedRoute>,
});

interface Student {
  id: number; matricule: string; firstName: string; lastName: string;
  Group?: { name: string };
}

interface UE {
  id: number; code: string; name: string;
  Semester?: { code: string };
}

interface SubjectInfo {
  id: number; name: string; coefficient: number; credits: number;
  UE?: UE;
}

interface Grade {
  id: number; studentId: number; subjectId: number;
  type: "CC" | "EXAM" | "RATTRAPAGE"; value: number; dateRecorded: string;
  Subject?: SubjectInfo;
}

interface GradeRow {
  cc?: number; exam?: number; ratt?: number;
  ccId?: number; examId?: number; rattId?: number;
}

function GradesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [localGrades, setLocalGrades] = useState<Record<number, GradeRow>>({});
  const [dirty, setDirty] = useState(false);

  const canEdit = user?.role === "admin" || user?.role === "teacher" || user?.role === "secretariat";
  const isAdmin = user?.role === "admin";
  const isAdminOrSecretariat = user?.role === "admin" || user?.role === "secretariat";

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await api.get("/students");
      return res.data.data as Student[];
    },
  });

  // Fetch ALL subjects (not just those with grades)
  const { data: allSubjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await api.get("/subjects");
      return res.data.data as SubjectInfo[];
    },
  });

  const { data: grades = [], isLoading: loadingGrades } = useQuery({
    queryKey: ["grades", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const res = await api.get(`/grades/student/${selectedStudentId}`);
      return res.data.data as Grade[];
    },
    enabled: !!selectedStudentId,
  });

  const studentId = parseInt(selectedStudentId);

  // Build grade map from API grades
  const gradeMap = useMemo(() => {
    const map: Record<number, GradeRow> = {};
    for (const g of grades) {
      if (!map[g.subjectId]) map[g.subjectId] = {};
      const val = typeof g.value === 'string' ? parseFloat(g.value) : g.value;
      if (g.type === "CC") { map[g.subjectId].cc = val; map[g.subjectId].ccId = g.id; }
      if (g.type === "EXAM") { map[g.subjectId].exam = val; map[g.subjectId].examId = g.id; }
      if (g.type === "RATTRAPAGE") { map[g.subjectId].ratt = val; map[g.subjectId].rattId = g.id; }
    }
    return map;
  }, [grades]);

  // Merge: displayGrades = gradeMap (from API) + local changes
  const displayGrades = useMemo(() => {
    if (!dirty) return gradeMap;
    const merged: Record<number, GradeRow> = { ...gradeMap };
    for (const [subjId, localRow] of Object.entries(localGrades)) {
      const id = parseInt(subjId);
      merged[id] = { ...merged[id], ...localRow };
    }
    return merged;
  }, [gradeMap, localGrades, dirty]);

  const setGrade = (subjectId: number, field: "cc" | "exam" | "ratt", v: string) => {
    const num = v === "" ? undefined : Math.min(20, Math.max(0, parseFloat(v)));
    setLocalGrades((prev) => ({
      ...prev,
      [subjectId]: { ...(prev[subjectId] || displayGrades[subjectId] || {}), [field]: num },
    }));
    setDirty(true);
  };

  const moy = (subjectId: number) => {
    const g = displayGrades[subjectId] ?? {};
    if (g.ratt != null) return g.ratt.toFixed(2);
    if (g.cc != null && g.exam != null) return (g.cc * 0.4 + g.exam * 0.6).toFixed(2);
    if (g.cc != null) return g.cc.toFixed(2);
    if (g.exam != null) return g.exam.toFixed(2);
    return "—";
  };

  const upsertMutation = useMutation({
    mutationFn: (payload: { studentId: number; subjectId: number; type: string; value: number }) =>
      api.post("/grades", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades", selectedStudentId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/grades/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades", selectedStudentId] });
    },
  });


  const handleSave = async () => {
    if (!selectedStudentId) return;
    try {
      const promises: Promise<any>[] = [];
      for (const [subjectIdStr, row] of Object.entries(localGrades)) {
        const subjectId = parseInt(subjectIdStr);
        const original = gradeMap[subjectId] ?? {};

        const fields: Array<{ key: "cc" | "exam" | "ratt"; type: "CC" | "EXAM" | "RATTRAPAGE" }> = [
          { key: "cc", type: "CC" },
          { key: "exam", type: "EXAM" },
          { key: "ratt", type: "RATTRAPAGE" },
        ];

        for (const { key, type } of fields) {
          const newVal = row[key];
          const oldVal = original[key];
          if (newVal !== oldVal && newVal !== undefined) {
            promises.push(upsertMutation.mutateAsync({ studentId, subjectId, type, value: newVal }));
          }
        }
      }
      await Promise.all(promises);
      setLocalGrades({});
      setDirty(false);
      toast.success("Notes enregistrées et moyennes recalculées");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleDeleteGrade = async (gradeId: number) => {
    try {
      await deleteMutation.mutateAsync(gradeId);
      toast.success("Note supprimée et moyennes recalculées");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  const selectedStudent = students.find((s) => s.id === studentId);

  return (
    <>
      <PageHeader
        title="Saisie des notes"
        description="Notes contrôle continu, examen et rattrapage"
      />
      <Card className="mb-4">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-start">
          <div className="flex-1 max-w-md">
            <StudentSearch
              students={students}
              value={selectedStudentId}
              onChange={(v) => { setSelectedStudentId(v); setLocalGrades({}); setDirty(false); }}
              placeholder="Rechercher un étudiant (nom, prénom, matricule)..."
            />
          </div>
          {selectedStudent && (
            <div className="text-sm text-muted-foreground pt-2">
              📚 {students.find(s => s.id === parseInt(selectedStudentId))?.Group?.name}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-sm">
          </div>
          <div className="text-sm text-muted-foreground self-center">
            Pondération : CC × 40% + Examen × 60% — Le rattrapage remplace la moyenne
          </div>
        </CardContent>
      </Card>

      {!selectedStudentId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Sélectionnez un étudiant pour voir et modifier ses notes
          </CardContent>
        </Card>
      ) : loadingGrades ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matière</TableHead>
                  <TableHead className="w-20">Coef</TableHead>
                  <TableHead className="w-28">CC /20</TableHead>
                  <TableHead className="w-28">Examen /20</TableHead>
                  <TableHead className="w-28">Rattrapage /20</TableHead>
                  <TableHead className="text-right w-24">Moyenne</TableHead>
                  {canEdit && <TableHead className="w-16" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSubjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 7 : 6} className="text-center text-muted-foreground py-8">
                      Aucune matière disponible. Créez des matières dans la page Programmes.
                    </TableCell>
                  </TableRow>
                ) : (
                  allSubjects.map((subj: SubjectInfo) => {
                    const g = displayGrades[subj.id] ?? {};
                    const avg = moy(subj.id);
                    return (
                      <TableRow key={subj.id}>
                        <TableCell className="font-medium">{subj.name}</TableCell>
                        <TableCell>{subj.coefficient}</TableCell>
                        <TableCell>
                          {canEdit ? (
                            <Input type="number" step="0.25" min={0} max={20}
                              value={g.cc ?? ""} onChange={(e) => setGrade(subj.id, "cc", e.target.value)} />
                          ) : (
                            g.cc ?? "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {canEdit ? (
                            <Input type="number" step="0.25" min={0} max={20}
                              value={g.exam ?? ""} onChange={(e) => setGrade(subj.id, "exam", e.target.value)} />
                          ) : (
                            g.exam ?? "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {canEdit ? (
                            <Input type="number" step="0.25" min={0} max={20}
                              value={g.ratt ?? ""} onChange={(e) => setGrade(subj.id, "ratt", e.target.value)} />
                          ) : (
                            g.ratt ?? "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          <span className={avg !== "—" && parseFloat(avg) >= 10 ? "text-success" : "text-destructive"}>
                            {avg}
                          </span>
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            {gradeMap[subj.id]?.rattId && (
                              <Button size="icon" variant="ghost" className="text-destructive h-7 w-7"
                                onClick={() => handleDeleteGrade(gradeMap[subj.id].rattId!)}
                                disabled={deleteMutation.isPending}
                                title="Supprimer la note de rattrapage">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {canEdit && dirty && (
              <div className="p-4 border-t flex justify-end">
                <Button 
                  onClick={handleSave} 
                  disabled={upsertMutation.isPending}
                >
                  {upsertMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
