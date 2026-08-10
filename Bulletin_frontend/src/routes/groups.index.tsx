import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
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
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Loader2, Users, Eye } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/groups/")({
  component: () => <ProtectedRoute roles={["admin", "secretariat"]}><GroupsPage /></ProtectedRoute>,
});

interface Group {
  id: number;
  name: string;
  academicYear: string;
  Students?: Array<{ id: number; matricule: string; firstName: string; lastName: string }>;
}

type GroupForm = {
  name: string;
  academicYear: string;
};

function GroupsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await api.get("/groups");
      return res.data.data as Group[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: GroupForm) => api.post("/groups", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Groupe créé");
      setOpen(false);
      setEditing(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erreur lors de la création"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<GroupForm> }) => api.put(`/groups/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Groupe modifié");
      setOpen(false);
      setEditing(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erreur lors de la modification"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Groupe supprimé");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erreur lors de la suppression"),
  });

  const onSave = (data: GroupForm) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <>
      <PageHeader
        title="Groupes / Classes"
        description={`${groups.length} groupes créés`}
        actions={
          isAdmin && (
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter un groupe
            </Button>
          )
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom du groupe</TableHead>
                  <TableHead>Année académique</TableHead>
                  <TableHead>Nb étudiants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Aucun groupe créé. Cliquez sur "Ajouter un groupe" pour commencer.
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell>{g.academicYear}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {g.Students?.length || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/groups/${g.id}`}>
                          <Button size="icon" variant="ghost" title="Voir détails">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {isAdmin && (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => { setEditing(g); setOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => deleteMutation.mutate(g.id)} 
                              className="text-destructive"
                              disabled={deleteMutation.isPending || (g.Students && g.Students.length > 0)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
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

      <GroupDialog
        open={open}
        onOpenChange={setOpen}
        group={editing}
        onSave={onSave}
        submitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
}

function GroupDialog({
  open, onOpenChange, group, onSave, submitting,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  group: Group | null; onSave: (g: GroupForm) => void; submitting: boolean;
}) {
  const emptyForm: GroupForm = { name: "", academicYear: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1) };
  const [form, setForm] = useState<GroupForm>(emptyForm);

  // Reset form when dialog opens
  useState(() => {
    if (open) {
      setForm(group ? { name: group.name, academicYear: group.academicYear } : emptyForm);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{group ? "Modifier" : "Créer"} un groupe</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <Label>Nom du groupe *</Label>
            <Input 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              placeholder="Ex: ASUR1, ASUR2..."
              required 
            />
          </div>
          <div className="space-y-1.5">
            <Label>Année académique *</Label>
            <Input 
              value={form.academicYear} 
              onChange={(e) => setForm({ ...form, academicYear: e.target.value })} 
              placeholder="Ex: 2024-2025"
              required 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button 
            onClick={() => onSave(form)} 
            disabled={submitting || !form.name || !form.academicYear}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
