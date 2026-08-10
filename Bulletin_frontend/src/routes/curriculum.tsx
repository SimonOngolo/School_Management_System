import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash2, BookOpen, Layers, GraduationCap, Search, Users2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/curriculum")({
  component: () => <ProtectedRoute roles={["admin", "secretariat"]}><CurriculumPage /></ProtectedRoute>,
});

// Types
interface Semester {
  id: number;
  name: string;
  code: string;
  totalCredits: number;
  academicYear: string;
  UEs?: UE[];
}

interface UE {
  id: number;
  code: string;
  name: string;
  coefficient: number;
  semesterId: number;
  Semester?: Semester;
  Subjects?: Subject[];
}

interface Subject {
  id: number;
  name: string;
  coefficient: number;
  credits: number;
  ueId: number;
  evaluationMode: 'MIXTE' | 'EXAM_ONLY' | 'CC_ONLY';
  UE?: UE;
}

function CurriculumPage() {
  return (
    <>
      <PageHeader
        title="Gestion des programmes"
        description="Administration des semestres, UE et matières"
      />
      <Tabs defaultValue="semesters" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="semesters" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> Semestres
          </TabsTrigger>
          <TabsTrigger value="ues" className="flex items-center gap-2">
            <Layers className="h-4 w-4" /> UE
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Matières
          </TabsTrigger>
        </TabsList>

        <TabsContent value="semesters">
          <SemestersTab />
        </TabsContent>
        <TabsContent value="ues">
          <UEsTab />
        </TabsContent>
        <TabsContent value="subjects">
          <SubjectsTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

// ==================== SEMESTERS TAB ====================
function SemestersTab() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Semester | null>(null);
  const [form, setForm] = useState({ name: "", code: "", totalCredits: "30", academicYear: "2025-2026" });

  const { data: semesters = [], isLoading } = useQuery({
    queryKey: ["semesters"],
    queryFn: async () => {
      const res = await api.get("/semesters");
      return res.data.data as Semester[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/semesters", {
      ...data,
      totalCredits: parseInt(data.totalCredits),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      toast.success("Semestre ajouté");
      setOpen(false);
      setForm({ name: "", code: "", totalCredits: "30", academicYear: "2025-2026" });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erreur"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) => api.put(`/semesters/${id}`, {
      ...data,
      totalCredits: parseInt(data.totalCredits),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      toast.success("Semestre modifié");
      setOpen(false);
      setEditing(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erreur"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/semesters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      toast.success("Semestre supprimé");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Impossible de supprimer (UE associées)"),
  });

  const handleEdit = (s: Semester) => {
    setEditing(s);
    setForm({
      name: s.name,
      code: s.code,
      totalCredits: String(s.totalCredits),
      academicYear: s.academicYear,
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Liste des semestres</CardTitle>
        <Button onClick={() => { setEditing(null); setForm({ name: "", code: "", totalCredits: "30", academicYear: "2025-2026" }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Année</TableHead>
                <TableHead>Crédits</TableHead>
                <TableHead>UE</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {semesters.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Aucun semestre</TableCell></TableRow>
              ) : semesters.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.code}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.academicYear}</TableCell>
                  <TableCell>{s.totalCredits}</TableCell>
                  <TableCell>{s.UEs?.length || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(s.id)} disabled={deleteMutation.isPending} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Modifier" : "Ajouter"} un semestre</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Semestre 5" required />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="S5" required />
            </div>
            <div className="space-y-2">
              <Label>Année académique</Label>
              <Input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} placeholder="2025-2026" required />
            </div>
            <div className="space-y-2">
              <Label>Crédits totaux</Label>
              <Input type="number" value={form.totalCredits} onChange={(e) => setForm({ ...form, totalCredits: e.target.value })} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editing ? "Modifier" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ==================== UEs TAB ====================
function UEsTab() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UE | null>(null);
  const [form, setForm] = useState({ code: "", name: "", coefficient: "1", semesterId: "" });

  const { data: semesters = [] } = useQuery({
    queryKey: ["semesters"],
    queryFn: async () => {
      const res = await api.get("/semesters");
      return res.data.data as Semester[];
    },
  });

  const { data: ues = [], isLoading } = useQuery({
    queryKey: ["ues"],
    queryFn: async () => {
      const res = await api.get("/ues");
      return res.data.data as UE[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/ues", {
      ...data,
      coefficient: parseInt(data.coefficient),
      semesterId: parseInt(data.semesterId),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ues"] });
      toast.success("UE ajoutée");
      setOpen(false);
      setForm({ code: "", name: "", coefficient: "1", semesterId: "" });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erreur"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) => api.put(`/ues/${id}`, {
      ...data,
      coefficient: parseInt(data.coefficient),
      semesterId: parseInt(data.semesterId),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ues"] });
      toast.success("UE modifiée");
      setOpen(false);
      setEditing(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erreur"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/ues/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ues"] });
      toast.success("UE supprimée");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Impossible de supprimer (matières associées)"),
  });

  const handleEdit = (ue: UE) => {
    setEditing(ue);
    setForm({
      code: ue.code,
      name: ue.name,
      coefficient: String(ue.coefficient),
      semesterId: String(ue.semesterId),
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Liste des Unités d'Enseignement</CardTitle>
        <Button onClick={() => { setEditing(null); setForm({ code: "", name: "", coefficient: "1", semesterId: "" }); setOpen(true); }} disabled={semesters.length === 0}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Semestre</TableHead>
                <TableHead>Coef</TableHead>
                <TableHead>Matières</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ues.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Aucune UE</TableCell></TableRow>
              ) : ues.map((ue) => (
                <TableRow key={ue.id}>
                  <TableCell className="font-medium">{ue.code}</TableCell>
                  <TableCell>{ue.name}</TableCell>
                  <TableCell>{ue.Semester?.code || "—"}</TableCell>
                  <TableCell>{ue.coefficient}</TableCell>
                  <TableCell>{ue.Subjects?.length || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(ue)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(ue.id)} disabled={deleteMutation.isPending} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Modifier" : "Ajouter"} une UE</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="UE51" required />
            </div>
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Administration Système" required />
            </div>
            <div className="space-y-2">
              <Label>Semestre</Label>
              <Select value={form.semesterId} onValueChange={(v) => setForm({ ...form, semesterId: v })} required>
                <SelectTrigger><SelectValue placeholder="Sélectionner un semestre" /></SelectTrigger>
                <SelectContent>
                  {semesters.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Coefficient</Label>
              <Input type="number" min="1" value={form.coefficient} onChange={(e) => setForm({ ...form, coefficient: e.target.value })} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || !form.semesterId}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editing ? "Modifier" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ==================== SUBJECTS TAB ====================
function SubjectsTab() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState({ name: "", coefficient: "1", credits: "3", ueId: "", evaluationMode: "MIXTE" });
  const [searchQuery, setSearchQuery] = useState("");

  const { data: ues = [] } = useQuery({
    queryKey: ["ues"],
    queryFn: async () => {
      const res = await api.get("/ues");
      return res.data.data as UE[];
    },
  });

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await api.get("/subjects");
      return res.data.data as Subject[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/subjects", {
      ...data,
      coefficient: parseInt(data.coefficient),
      credits: parseInt(data.credits),
      ueId: parseInt(data.ueId),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Matière ajoutée");
      setOpen(false);
      setForm({ name: "", coefficient: "1", credits: "3", ueId: "", evaluationMode: "MIXTE" });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erreur"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) => api.put(`/subjects/${id}`, {
      ...data,
      coefficient: parseInt(data.coefficient),
      credits: parseInt(data.credits),
      ueId: parseInt(data.ueId),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Matière modifiée");
      setOpen(false);
      setEditing(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erreur"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/subjects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Matière supprimée");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Impossible de supprimer (notes/absences associées)"),
  });

  const handleEdit = (s: Subject) => {
    setEditing(s);
    setForm({
      name: s.name,
      coefficient: String(s.coefficient),
      credits: String(s.credits),
      ueId: String(s.ueId),
      evaluationMode: s.evaluationMode || "MIXTE",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  // Filtrer les matières selon la recherche
  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.UE?.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.UE?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Liste des matières</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une matière..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => { setEditing(null); setForm({ name: "", coefficient: "1", credits: "3", ueId: "", evaluationMode: "MIXTE" }); setOpen(true); }} disabled={ues.length === 0}>
            <Plus className="h-4 w-4 mr-2" /> Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>UE</TableHead>
                <TableHead>Semestre</TableHead>
                <TableHead>Coef</TableHead>
                <TableHead>Crédits</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubjects.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">
                  {searchQuery ? "Aucune matière trouvée" : "Aucune matière"}
                </TableCell></TableRow>
              ) : filteredSubjects.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.UE?.code || "—"}</TableCell>
                  <TableCell>{s.UE?.Semester?.code || "—"}</TableCell>
                  <TableCell>{s.coefficient}</TableCell>
                  <TableCell>{s.credits}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(s.id)} disabled={deleteMutation.isPending} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Modifier" : "Ajouter"} une matière</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Administration Windows Server" required />
            </div>
            <div className="space-y-2">
              <Label>UE</Label>
              <Select value={form.ueId} onValueChange={(v) => setForm({ ...form, ueId: v })} required>
                <SelectTrigger><SelectValue placeholder="Sélectionner une UE" /></SelectTrigger>
                <SelectContent>
                  {ues.map((ue) => (
                    <SelectItem key={ue.id} value={String(ue.id)}>
                      {ue.code} — {ue.name} ({ue.Semester?.code || "?"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Coefficient</Label>
                <Input type="number" min="1" value={form.coefficient} onChange={(e) => setForm({ ...form, coefficient: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Crédits ECTS</Label>
                <Input type="number" min="1" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mode d'évaluation</Label>
              <Select value={form.evaluationMode} onValueChange={(v) => setForm({ ...form, evaluationMode: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MIXTE">MIXTE (CC + Examen)</SelectItem>
                  <SelectItem value="EXAM_ONLY">Examen seul</SelectItem>
                  <SelectItem value="CC_ONLY">CC seul</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                MIXTE: nécessite CC + Examen pour calculer une moyenne. Les autres modes acceptent une seule note.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || !form.ueId}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editing ? "Modifier" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
