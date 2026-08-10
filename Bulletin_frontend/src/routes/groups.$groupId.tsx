import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, BookOpen, GraduationCap, ArrowLeft, Loader2, 
  UserCircle, Calendar, Hash 
} from "lucide-react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/groups/$groupId")({
  component: () => (
    <ProtectedRoute roles={["admin", "secretariat"]}>
      <GroupDetailPage />
    </ProtectedRoute>
  ),
});

interface Student {
  id: number;
  matricule: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface UE {
  id: number;
  code: string;
  name: string;
  coefficient: number;
}

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface GroupData {
  id: number;
  name: string;
  academicYear: string;
  Students: Student[];
  UEs: UE[];
  Teachers: Teacher[];
}

function GroupDetailPage() {
  const { groupId } = useParams({ from: "/groups/$groupId" });

  const { data: group, isLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Groupe non trouvé</p>
        <Link to="/groups">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux groupes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={group.name}
        description={`Année académique: ${group.academicYear}`}
        actions={
          <Link to="/groups">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Étudiants
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {group.Students?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              UEs Assignées
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {group.UEs?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Enseignants
            </CardTitle>
            <UserCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {group.Teachers?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Étudiants
          </TabsTrigger>
          <TabsTrigger value="ues" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            UEs
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Enseignants
          </TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Liste des Étudiants
              </CardTitle>
            </CardHeader>
            <CardContent>
              {group.Students?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucun étudiant dans ce groupe
                </p>
              ) : (
                <div className="space-y-2">
                  {group.Students?.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Hash className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {student.lastName} {student.firstName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {student.email}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{student.matricule}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* UEs Tab */}
        <TabsContent value="ues">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Unités d'Enseignement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {group.UEs?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune UE assignée à ce groupe
                </p>
              ) : (
                <div className="space-y-2">
                  {group.UEs?.map((ue) => (
                    <div
                      key={ue.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {ue.code} - {ue.name}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        Coef: {ue.coefficient}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Enseignants Assignés
              </CardTitle>
            </CardHeader>
            <CardContent>
              {group.Teachers?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucun enseignant assigné à ce groupe
                </p>
              ) : (
                <div className="space-y-2">
                  {group.Teachers?.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <UserCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {teacher.lastName} {teacher.firstName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {teacher.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
