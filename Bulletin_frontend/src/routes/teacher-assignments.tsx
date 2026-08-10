import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, UserCircle, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/teacher-assignments")({
  component: () => (
    <ProtectedRoute roles={["admin"]}>
      <TeacherAssignmentsPage />
    </ProtectedRoute>
  ),
});

interface Group {
  id: number;
  name: string;
  academicYear: string;
}

interface Teacher {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

interface TeacherGroup {
  id: number;
  teacherId: number;
  groupId: number;
  Teacher: Teacher | null;
}

function TeacherAssignmentsPage() {
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  // Fetch all groups
  const { data: groupsRaw = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await api.get("/groups");
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.groups)) return res.data.groups;
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    },
  });
  const groups: Group[] = Array.isArray(groupsRaw) ? groupsRaw : [];

  // Fetch all teachers
  const { data: teachersRaw = [], isLoading: teachersLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const res = await api.get("/teachers");
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.teachers)) return res.data.teachers;
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    },
  });
  const teachers: Teacher[] = Array.isArray(teachersRaw) ? teachersRaw : [];

  // Fetch teachers assigned to selected group
  const { data: groupTeachersRaw = [], isLoading: groupTeachersLoading } = useQuery({
    queryKey: ["group-teachers", selectedGroupId],
    queryFn: async () => {
      if (!selectedGroupId) return [];
      const res = await api.get(`/groups/${selectedGroupId}/teachers`);
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    },
    enabled: !!selectedGroupId,
  });
  const groupTeachers: TeacherGroup[] = Array.isArray(groupTeachersRaw)
    ? groupTeachersRaw
    : [];

  // Assign teacher mutation
  const assignMutation = useMutation({
    mutationFn: async () => {
      return api.post("/teacher-groups", {
        teacherId: parseInt(selectedTeacherId),
        groupId: parseInt(selectedGroupId),
      });
    },
    onSuccess: () => {
      toast.success("Enseignant affecté au groupe avec succès");
      setSelectedTeacherId("");
      queryClient.invalidateQueries({
        queryKey: ["group-teachers", selectedGroupId],
      });
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        "Erreur lors de l'affectation de l'enseignant";
      toast.error(message);
    },
  });

  // Remove teacher mutation
  const removeMutation = useMutation({
    mutationFn: async (teacherGroupId: number) => {
      return api.delete(`/teacher-groups/${teacherGroupId}`);
    },
    onSuccess: () => {
      toast.success("Enseignant retiré du groupe");
      queryClient.invalidateQueries({
        queryKey: ["group-teachers", selectedGroupId],
      });
    },
    onError: (err: any) => {
      toast.error("Erreur lors du retrait de l'enseignant");
    },
  });

  // Get available teachers (not already assigned)
  const assignedTeacherIds = new Set(groupTeachers.map((tg) => tg.teacherId));
  const availableTeachers = teachers.filter(
    (t) => !assignedTeacherIds.has(t.id)
  );

  return (
    <>
      <PageHeader
        title="Affectation des Enseignants"
        description="Assigner des enseignants aux groupes"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Assignment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Affecter un Enseignant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Group Selection */}
            <div className="space-y-2">
              <Label>Groupe</Label>
              <Select
                value={selectedGroupId}
                onValueChange={setSelectedGroupId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un groupe" />
                </SelectTrigger>
                <SelectContent>
                  {groupsLoading ? (
                    <SelectItem value="loading" disabled>
                      Chargement...
                    </SelectItem>
                  ) : (
                    groups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name} ({group.academicYear})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Teacher Selection */}
            <div className="space-y-2">
              <Label>Enseignant</Label>
              <Select
                value={selectedTeacherId}
                onValueChange={setSelectedTeacherId}
                disabled={!selectedGroupId || availableTeachers.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !selectedGroupId
                        ? "D'abord sélectionner un groupe"
                        : availableTeachers.length === 0
                        ? "Tous les enseignants sont déjà assignés"
                        : "Sélectionner un enseignant"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {teachersLoading ? (
                    <SelectItem value="loading" disabled>
                      Chargement...
                    </SelectItem>
                  ) : (
                    availableTeachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.lastName} {teacher.firstName} ({teacher.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => assignMutation.mutate()}
              disabled={!selectedGroupId || !selectedTeacherId || assignMutation.isPending}
              className="w-full"
            >
              {assignMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Affecter l'enseignant
            </Button>
          </CardContent>
        </Card>

        {/* Right Column - Assigned Teachers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Enseignants Assignés
              {selectedGroupId && (
                <Badge variant="secondary" className="ml-auto">
                  {groupTeachers.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedGroupId ? (
              <p className="text-muted-foreground text-center py-8">
                Sélectionnez un groupe pour voir ses enseignants
              </p>
            ) : groupTeachersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : groupTeachers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucun enseignant assigné à ce groupe
              </p>
            ) : (
              <div className="space-y-2">
                {groupTeachers.map((tg) => (
                  <div
                    key={tg.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <UserCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {tg.Teacher?.lastName} {tg.Teacher?.firstName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {tg.Teacher?.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => removeMutation.mutate(tg.id)}
                      disabled={removeMutation.isPending}
                    >
                      {removeMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
