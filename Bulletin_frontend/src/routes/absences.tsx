import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/absences")({
  component: () => <ProtectedRoute roles={["admin", "secretariat"]}><AbsencesPage /></ProtectedRoute>,
});

interface Student {
  id: number; matricule: string; firstName: string; lastName: string;
}

interface SubjectInfo {
  id: number; name: string;
}

interface Absence {
  id: number;
  studentId: number;
  subjectId: number;
  hours: number;
  createdAt: string;
  Subject?: SubjectInfo;
}

interface AbsenceDisplay extends Absence {
  studentName?: string;
  subjectName?: string;
}

function AbsencesPage() {
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [open, setOpen] = useState(false);

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await api.get("/students");
      return res.data.data as Student[];
    },
  });

  const { data: absences = [], isLoading: loadingAbsences } = useQuery({
    queryKey: ["absences", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const res = await api.get(`/absences/student/${selectedStudentId}`);
      return res.data.data as Absence[];
    },
    enabled: !!selectedStudentId,
  });

  const studentMap = new Map(students.map((s) => [s.id, s]));

  const displayList: AbsenceDisplay[] = absences.map((a) => ({
    ...a,
    studentName: studentMap.get(a.studentId)
      ? `${studentMap.get(a.studentId)!.firstName} ${studentMap.get(a.studentId)!.lastName}`
      : `Étudiant #${a.studentId}`,
    subjectName: a.Subject?.name || `Matière #${a.subjectId}`,
  }));

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/absences/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences", selectedStudentId] });
      toast.success("Absence supprimée");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erreur lors de la suppression"),
  });

  const createMutation = useMutation({
    mutationFn: (data: { studentId: number; subjectId: number; hours: number }) =>
      api.post("/absences", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences", selectedStudentId] });
      toast.success("Absence ajoutée");
      setOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erreur lors de l'ajout"),
  });

  const studentId = parseInt(selectedStudentId);

  return (
    <>
      <PageHeader
        title="Absences"
        description="Suivi des absences et pénalités appliquées (0,01 pt / heure)"
        actions={
          selectedStudentId ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-sm">
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un étudiant" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.matricule} — {s.firstName} {s.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!selectedStudentId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Sélectionnez un étudiant pour voir ses absences
          </CardContent>
        </Card>
      ) : loadingAbsences ? (
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
                  <TableHead>Étudiant</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Heures</TableHead>
                  <TableHead>Pénalité</TableHead>
                  <TableHead>Date saisie</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Aucune absence enregistrée
                    </TableCell>
                  </TableRow>
                ) : (
                  displayList.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.studentName}</TableCell>
                      <TableCell>{a.subjectName}</TableCell>
                      <TableCell>{a.hours}h</TableCell>
                      <TableCell className="text-destructive font-mono">-{(a.hours * 0.01).toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.createdAt ? new Date(a.createdAt).toLocaleDateString("fr-FR") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" className="text-destructive"
                          onClick={() => deleteMutation.mutate(a.id)} disabled={deleteMutation.isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AddAbsenceDialog
        open={open}
        onOpenChange={setOpen}
        studentId={studentId}
        onSubmit={(data) => createMutation.mutate({ ...data, studentId })}
        submitting={createMutation.isPending}
      />
    </>
  );
}

function AddAbsenceDialog({
  open, onOpenChange, studentId, onSubmit, submitting,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  studentId: number;
  onSubmit: (data: { subjectId: number; hours: number }) => void;
  submitting: boolean;
}) {
  const [subjectId, setSubjectId] = useState<string>("");
  const [hours, setHours] = useState<string>("1");

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await api.get("/subjects");
      return res.data.data as SubjectInfo[];
    },
    enabled: !!studentId && open,
  });

  useEffect(() => {
    if (open) { setSubjectId(""); setHours("1"); }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une absence</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Matière</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner une matière" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s: any) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Heures d'absence</Label>
            <Input type="number" min={0.5} step={0.5} value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
          <div className="text-sm text-muted-foreground">
            Pénalité : -{(parseFloat(hours || "0") * 0.01).toFixed(2)} pt
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            onClick={() => onSubmit({ subjectId: parseInt(subjectId), hours: parseFloat(hours) })}
            disabled={submitting || !subjectId}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
