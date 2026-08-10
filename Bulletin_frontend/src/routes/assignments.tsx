import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Link2 } from "lucide-react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/assignments")({
  component: () => (
    <ProtectedRoute allowedRoles={["admin", "secretariat"]}>
      <AssignmentsPage />
    </ProtectedRoute>
  ),
});

function AssignmentsPage() {
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedUEs, setSelectedUEs] = useState<string[]>([]);

  const { data: groupsRaw = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await api.get("/groups");
      // Handle different API response formats
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.groups)) return res.data.groups;
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    },
  });
  const groups = Array.isArray(groupsRaw) ? groupsRaw : [];

  const { data: allUEsRaw = [], isLoading: uesLoading } = useQuery({
    queryKey: ["ues"],
    queryFn: async () => {
      const res = await api.get("/ues");
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.ues)) return res.data.ues;
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    },
  });
  const allUEs = Array.isArray(allUEsRaw) ? allUEsRaw : [];

  const { data: groupUEsRaw = [], isLoading: groupUEsLoading } = useQuery({
    queryKey: ["group-ues", selectedGroupId],
    queryFn: async () => {
      if (!selectedGroupId) return [];
      const res = await api.get(`/groups/${selectedGroupId}/ues`);
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.groupUEs)) return res.data.groupUEs;
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    },
    enabled: !!selectedGroupId,
  });
  const groupUEs = Array.isArray(groupUEsRaw) ? groupUEsRaw : [];

  const assignMutation = useMutation({
    mutationFn: async (ueIds: string[]) => {
      const res = await api.post("/group-ues", {
        groupId: parseInt(selectedGroupId),
        ueIds: ueIds.map((id) => parseInt(id)),
      });
      return res.data;
    },
    onSuccess: (data) => {
      const created = data?.data?.created?.length || 0;
      const errors = data?.data?.errors?.length || 0;
      
      if (created > 0) {
        toast.success(`${created} UE(s) affectée(s) avec succès`);
      } else if (errors > 0) {
        toast.error(`${errors} UE(s) non affectée(s) - déjà assignées ou erreur`);
      } else {
        toast.info("Aucune UE n'a été affectée");
      }
      
      setSelectedUEs([]);
      queryClient.invalidateQueries({ queryKey: ["group-ues", selectedGroupId] });
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || "Erreur lors de l'affectation";
      toast.error(message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (groupUEId: number) => {
      await api.delete(`/group-ues/${groupUEId}`);
    },
    onSuccess: () => {
      toast.success("UE retirée avec succès");
      queryClient.invalidateQueries({ queryKey: ["group-ues", selectedGroupId] });
    },
    onError: () => toast.error("Erreur lors du retrait"),
  });

  const selectedGroup = groups.find((g: any) => String(g.id) === selectedGroupId);
  const assignedUEIds = groupUEs.map((gue: any) => gue.ueId);
  const availableUEs = allUEs.filter((ue: any) => !assignedUEIds.includes(ue.id));

  const toggleUE = (ueId: string) => {
    setSelectedUEs((prev) =>
      prev.includes(ueId) ? prev.filter((id) => id !== ueId) : [...prev, ueId]
    );
  };

  const handleAssign = () => {
    if (selectedUEs.length === 0) return;
    assignMutation.mutate(selectedUEs);
  };

  const isLoading = groupsLoading || uesLoading;

  return (
    <>
      <PageHeader title="Affectations Groupes ↔ UE" description="Gérer les associations entre groupes et unités d'enseignement" />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sélection et UE disponibles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Affecter des UE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sélection du groupe */}
            <div className="space-y-2">
              <Label>Groupe</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un groupe" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g: any) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name} ({g.academicYear})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedGroup && (
              <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                📚 {selectedGroup.name} • {selectedGroup.academicYear}
              </div>
            )}

            {/* UE disponibles groupées par semestre */}
            {selectedGroup && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>UE disponibles ({availableUEs.length})</Label>
                  {selectedUEs.length > 0 && (
                    <Badge variant="secondary">{selectedUEs.length} sélectionnée(s)</Badge>
                  )}
                </div>

                {availableUEs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Toutes les UE sont assignées</p>
                ) : (
                  <>
                    <div className="border rounded-lg p-4 max-h-80 overflow-y-auto space-y-4">
                      {/* S5 - Semestre 1 */}
                      {availableUEs.filter((ue: any) => ue.Semester?.code === 'S5').length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 p-2 rounded">
                            <span>📚</span> Semestre 1 (S5)
                          </div>
                          <div className="space-y-1 pl-2">
                            {availableUEs
                              .filter((ue: any) => ue.Semester?.code === 'S5')
                              .map((ue: any) => (
                                <div
                                  key={ue.id}
                                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                                    selectedUEs.includes(String(ue.id))
                                      ? "bg-primary/10 border border-primary"
                                      : "hover:bg-muted border border-transparent"
                                  }`}
                                  onClick={() => toggleUE(String(ue.id))}
                                >
                                  <div
                                    className={`w-4 h-4 rounded flex items-center justify-center ${
                                      selectedUEs.includes(String(ue.id))
                                        ? "bg-primary text-white"
                                        : "border border-gray-300"
                                    }`}
                                  >
                                    {selectedUEs.includes(String(ue.id)) && <Plus className="h-3 w-3" />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{ue.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {ue.code} • Coef: {ue.coefficient}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* S6 - Semestre 2 */}
                      {availableUEs.filter((ue: any) => ue.Semester?.code === 'S6').length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-semibold text-green-600 bg-green-50 p-2 rounded">
                            <span>📚</span> Semestre 2 (S6)
                          </div>
                          <div className="space-y-1 pl-2">
                            {availableUEs
                              .filter((ue: any) => ue.Semester?.code === 'S6')
                              .map((ue: any) => (
                                <div
                                  key={ue.id}
                                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                                    selectedUEs.includes(String(ue.id))
                                      ? "bg-primary/10 border border-primary"
                                      : "hover:bg-muted border border-transparent"
                                  }`}
                                  onClick={() => toggleUE(String(ue.id))}
                                >
                                  <div
                                    className={`w-4 h-4 rounded flex items-center justify-center ${
                                      selectedUEs.includes(String(ue.id))
                                        ? "bg-primary text-white"
                                        : "border border-gray-300"
                                    }`}
                                  >
                                    {selectedUEs.includes(String(ue.id)) && <Plus className="h-3 w-3" />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{ue.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {ue.code} • Coef: {ue.coefficient}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* UE sans semestre */}
                      {availableUEs.filter((ue: any) => !ue.Semester?.code).length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 bg-gray-50 p-2 rounded">
                            <span>📚</span> Sans semestre défini
                          </div>
                          <div className="space-y-1 pl-2">
                            {availableUEs
                              .filter((ue: any) => !ue.Semester?.code)
                              .map((ue: any) => (
                                <div
                                  key={ue.id}
                                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                                    selectedUEs.includes(String(ue.id))
                                      ? "bg-primary/10 border border-primary"
                                      : "hover:bg-muted border border-transparent"
                                  }`}
                                  onClick={() => toggleUE(String(ue.id))}
                                >
                                  <div
                                    className={`w-4 h-4 rounded flex items-center justify-center ${
                                      selectedUEs.includes(String(ue.id))
                                        ? "bg-primary text-white"
                                        : "border border-gray-300"
                                    }`}
                                  >
                                    {selectedUEs.includes(String(ue.id)) && <Plus className="h-3 w-3" />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{ue.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {ue.code} • Coef: {ue.coefficient}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={handleAssign}
                      disabled={selectedUEs.length === 0 || assignMutation.isPending}
                      className="w-full"
                    >
                      {assignMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      Affecter {selectedUEs.length} UE(s) au groupe
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* UE assignées */}
        <Card>
          <CardHeader>
            <CardTitle>UE assignées au groupe</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedGroupId ? (
              <p className="text-muted-foreground text-center py-8">
                Sélectionnez un groupe pour voir ses UE
              </p>
            ) : groupUEsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : groupUEs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucune UE assignée à ce groupe
              </p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* S5 assignées */}
                {groupUEs.filter((gue: any) => gue.UE?.Semester?.code === 'S5').length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-blue-600 bg-blue-50 p-2 rounded">
                      📚 Semestre 1 (S5)
                    </div>
                    <div className="space-y-2">
                      {groupUEs
                        .filter((gue: any) => gue.UE?.Semester?.code === 'S5')
                        .map((gue: any) => (
                          <div
                            key={gue.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div>
                              <div className="font-medium text-sm">
                                {gue.UE?.code} - {gue.UE?.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Coef: {gue.UE?.coefficient}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMutation.mutate(gue.id)}
                              disabled={removeMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* S6 assignées */}
                {groupUEs.filter((gue: any) => gue.UE?.Semester?.code === 'S6').length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-green-600 bg-green-50 p-2 rounded">
                      📚 Semestre 2 (S6)
                    </div>
                    <div className="space-y-2">
                      {groupUEs
                        .filter((gue: any) => gue.UE?.Semester?.code === 'S6')
                        .map((gue: any) => (
                          <div
                            key={gue.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div>
                              <div className="font-medium text-sm">
                                {gue.UE?.code} - {gue.UE?.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Coef: {gue.UE?.coefficient}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMutation.mutate(gue.id)}
                              disabled={removeMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Sans semestre */}
                {groupUEs.filter((gue: any) => !gue.UE?.Semester?.code).length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-600 bg-gray-50 p-2 rounded">
                      📚 Sans semestre
                    </div>
                    <div className="space-y-2">
                      {groupUEs
                        .filter((gue: any) => !gue.UE?.Semester?.code)
                        .map((gue: any) => (
                          <div
                            key={gue.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div>
                              <div className="font-medium text-sm">
                                {gue.UE?.code} - {gue.UE?.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Coef: {gue.UE?.coefficient}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMutation.mutate(gue.id)}
                              disabled={removeMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
