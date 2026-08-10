import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Calculator, Award } from "lucide-react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/my-grades")({
  component: () => (
    <ProtectedRoute roles={["student" as const]}>
      <MyGradesPage />
    </ProtectedRoute>
  ),
});

interface Grade {
  id: number;
  type: "CC" | "EXAM" | "RATTRAPAGE";
  value: string;
  dateRecorded: string;
  Subject: {
    id: number;
    name: string;
    coefficient: number;
    credits: number;
    UE: {
      id: number;
      code: string;
      name: string;
      Semester: {
        id: number;
        name: string;
      };
    };
  };
}

function MyGradesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-grades"],
    queryFn: async () => {
      const res = await api.get("/student/grades");
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { student, grades } = data || {};
  const gradeEntries: Grade[] = [];
  let idCounter = 1;
  
  // Transformer les données organisées en liste
  if (grades) {
    Object.entries(grades).forEach(([semester, ues]: [string, any]) => {
      Object.entries(ues).forEach(([ueName, subjects]: [string, any]) => {
        Object.entries(subjects).forEach(([subjectName, subjectData]: [string, any]) => {
          Object.entries(subjectData.grades).forEach(([type, gradeData]: [string, any]) => {
            gradeEntries.push({
              id: idCounter++,
              type: type as "CC" | "EXAM" | "RATTRAPAGE",
              value: gradeData.value,
              dateRecorded: gradeData.dateRecorded,
              Subject: {
                id: subjectData.subjectId,
                name: subjectName,
                coefficient: subjectData.coefficient,
                credits: subjectData.credits,
                UE: {
                  id: 0,
                  code: ueName,
                  name: ueName,
                  Semester: {
                    id: 0,
                    name: semester,
                  },
                },
              },
            });
          });
        });
      });
    });
  }

  // Calculer les moyennes par matière
  const subjectAverages: Record<string, { name: string; average: number | null; coefficient: number; credits: number }> = {};
  
  gradeEntries.forEach((grade) => {
    const key = `${grade.Subject.UE.name}-${grade.Subject.name}`;
    if (!subjectAverages[key]) {
      subjectAverages[key] = {
        name: grade.Subject.name,
        average: null,
        coefficient: grade.Subject.coefficient,
        credits: grade.Subject.credits,
      };
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Mes Notes - ${student?.firstName} ${student?.lastName}`}
        description={`Groupe: ${student?.group} | Matricule: ${student?.matricule}`}
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matières</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(subjectAverages).length}</div>
            <p className="text-xs text-muted-foreground">Matières suivies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notes saisies</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradeEntries.length}</div>
            <p className="text-xs text-muted-foreground">Contrôles & Examens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne générale</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Consultez votre bulletin</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des notes */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des notes</CardTitle>
        </CardHeader>
        <CardContent>
          {gradeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune note enregistrée pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Semestre</th>
                    <th className="text-left py-3 px-4 font-medium">UE</th>
                    <th className="text-left py-3 px-4 font-medium">Matière</th>
                    <th className="text-center py-3 px-4 font-medium">Type</th>
                    <th className="text-center py-3 px-4 font-medium">Note</th>
                    <th className="text-center py-3 px-4 font-medium">Coef</th>
                    <th className="text-center py-3 px-4 font-medium">Crédits</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeEntries.map((grade, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{grade.Subject.UE.Semester.name}</td>
                      <td className="py-3 px-4">{grade.Subject.UE.name}</td>
                      <td className="py-3 px-4 font-medium">{grade.Subject.name}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={grade.type === "CC" ? "default" : grade.type === "EXAM" ? "secondary" : "destructive"}>
                          {grade.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{grade.value}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{grade.Subject.coefficient}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{grade.Subject.credits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
