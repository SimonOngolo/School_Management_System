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
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface Group {
  id: number;
  name: string;
  academicYear: string;
}

export const Route = createFileRoute("/students")({
  component: () => <ProtectedRoute roles={["admin", "secretariat", "teacher"]}><StudentsPage /></ProtectedRoute>,
});

interface Student {
  id: number;
  matricule: string;
  groupId: number | null;
  Group?: Group | null;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  birthPlace: string | null;
  bacType: string | null;
  originSchool: string | null;
}

type StudentForm = {
  matricule: string;
  groupId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  bacType: string;
  originSchool: string;
};

function StudentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students", selectedGroupId],
    queryFn: async () => {
      const params = selectedGroupId && selectedGroupId !== "all" ? { groupId: selectedGroupId } : {};
      const res = await api.get("/students", { params });
      return res.data.data as Student[];
    },
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await api.get("/groups");
      return res.data.data as Group[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: StudentForm) => api.post("/students", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Étudiant ajouté");
      setOpen(false);
      setEditing(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erreur lors de l'ajout"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StudentForm> }) => api.put(`/students/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Étudiant modifié");
      setOpen(false);
      setEditing(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erreur lors de la modification"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Étudiant supprimé");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erreur lors de la suppression"),
  });

  const filtered = students.filter((s) =>
    [s.firstName, s.lastName, s.matricule].some((f) => f?.toLowerCase().includes(q.toLowerCase())),
  );

  const onSave = (data: StudentForm) => {
    // Convertir "none" en "" pour le backend
    const processedData = {
      ...data,
      groupId: data.groupId === "none" ? "" : data.groupId,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: processedData });
    } else {
      createMutation.mutate(processedData);
    }
  };

  const canDelete = user?.role === "admin";

  return (
    <>
      <PageHeader
        title="Étudiants"
        description={`${students.length} étudiants inscrits`}
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Ajouter
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un étudiant..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tous les groupes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les groupes</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.name} ({g.academicYear})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead className="hidden md:table-cell">Groupe</TableHead>
                  <TableHead>Nom complet</TableHead>
                  <TableHead className="hidden md:table-cell">Date naissance</TableHead>
                  <TableHead className="hidden lg:table-cell">Lieu naissance</TableHead>
                  <TableHead className="hidden lg:table-cell">Bac</TableHead>
                  <TableHead className="hidden xl:table-cell">École d'origine</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Aucun étudiant trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.matricule}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{s.Group?.name || "—"}</TableCell>
                      <TableCell className="font-medium">{s.firstName} {s.lastName}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {s.birthDate ? new Date(s.birthDate).toLocaleDateString("fr-FR") : "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{s.birthPlace || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{s.bacType || "—"}</TableCell>
                      <TableCell className="hidden xl:table-cell">{s.originSchool || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => { setEditing(s); setOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(s.id)} className="text-destructive" disabled={deleteMutation.isPending}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <StudentDialog
        open={open}
        onOpenChange={setOpen}
        student={editing}
        onSave={onSave}
        submitting={createMutation.isPending || updateMutation.isPending}
        groups={groups}
      />
    </>
  );
}

function StudentDialog({
  open, onOpenChange, student, onSave, submitting, groups,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  student: Student | null; onSave: (s: StudentForm) => void; submitting: boolean;
  groups: Group[];
}) {
  const emptyForm: StudentForm = { matricule: "", groupId: "none", firstName: "", lastName: "", birthDate: "", birthPlace: "", bacType: "", originSchool: "" };
  const [form, setForm] = useState<StudentForm>(emptyForm);

  useEffect(() => {
    setForm(student ? {
      matricule: student.matricule,
      groupId: student.groupId ? String(student.groupId) : "none",
      firstName: student.firstName,
      lastName: student.lastName,
      birthDate: student.birthDate ?? "",
      birthPlace: student.birthPlace ?? "",
      bacType: student.bacType ?? "",
      originSchool: student.originSchool ?? "",
    } : emptyForm);
  }, [student, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{student ? "Modifier" : "Ajouter"} un étudiant</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Matricule" value={form.matricule} onChange={(v) => setForm({ ...form, matricule: v })} required />
          <div className="space-y-1.5">
            <Label>Groupe</Label>
            <Select value={form.groupId} onValueChange={(v) => setForm({ ...form, groupId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un groupe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun groupe</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.name} ({g.academicYear})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Field label="Prénom" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
          <Field label="Nom" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
          <Field label="Date de naissance" value={form.birthDate} onChange={(v) => setForm({ ...form, birthDate: v })} type="date" />
          <Field label="Lieu de naissance" value={form.birthPlace} onChange={(v) => setForm({ ...form, birthPlace: v })} />
          <Field label="Type de Bac" value={form.bacType} onChange={(v) => setForm({ ...form, bacType: v })} />
          <div className="sm:col-span-2">
            <Field label="École d'origine" value={form.originSchool} onChange={(v) => setForm({ ...form, originSchool: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => onSave(form)} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && " *"}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} type={type} required={required} />
    </div>
  );
}
