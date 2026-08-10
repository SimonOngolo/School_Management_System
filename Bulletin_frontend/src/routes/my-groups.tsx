import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen } from "lucide-react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/my-groups")({
  component: () => (
    <ProtectedRoute roles={["teacher"]}>
      <MyGroupsPage />
    </ProtectedRoute>
  ),
});

interface Subject {
  id: number;
  name: string;
  coefficient: number;
  credits: number;
}

interface UE {
  id: number;
  code: string;
  name: string;
  coefficient: number;
  Subjects: Subject[];
}

interface Group {
  id: number;
  name: string;
  academicYear: string;
  UEs: UE[];
}

function MyGroupsPage() {
  const { user } = useAuth();

  const { data: teacherData, isLoading } = useQuery({
    queryKey: ["teacher-groups", user?.id],
    queryFn: async () => {
      // Appel API pour récupérer les groupes de l'enseignant connecté
      const res = await api.get("/my/groups");
      return res.data;
    },
    enabled: !!user?.id,
  });

  // L'API retourne { success: true, data: [...] }
  const groups: Group[] = Array.isArray(teacherData?.data) ? teacherData.data : 
                         Array.isArray(teacherData) ? teacherData : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Mes Groupes"
        description="Groupes et matières qui vous sont affectés"
      />

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucun groupe ne vous est actuellement affecté.
            <br />
            Contactez l'administration pour plus d'informations.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {group.academicYear}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {group.UEs?.length || 0} UE(s)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {group.UEs && group.UEs.length > 0 ? (
                  <div className="space-y-3">
                    {group.UEs.map((ue) => (
                      <div key={ue.id} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {ue.code} - {ue.name}
                          </span>
                          <Badge variant="secondary" className="ml-auto">
                            Coef: {ue.coefficient}
                          </Badge>
                        </div>
                        {ue.Subjects && ue.Subjects.length > 0 && (
                          <div className="pl-6 space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                              Matières:
                            </p>
                            {ue.Subjects.map((subject) => (
                              <div
                                key={subject.id}
                                className="flex items-center justify-between text-sm py-1"
                              >
                                <span>{subject.name}</span>
                                <span className="text-muted-foreground">
                                  Coef: {subject.coefficient} • {subject.credits} crédits
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucune UE assignée à ce groupe
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
