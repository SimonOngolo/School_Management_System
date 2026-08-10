import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Download, Printer, Award, BookOpen } from "lucide-react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/my-bulletin")({
  component: () => (
    <ProtectedRoute roles={["student" as const]}>
      <MyBulletinPage />
    </ProtectedRoute>
  ),
});

function MyBulletinPage() {
  const [semester, setSemester] = useState<string | null>(null); // null = annuel

  const { data, isLoading } = useQuery({
    queryKey: ["my-bulletin", semester],
    queryFn: async () => {
      const params = semester ? `?semester=${semester}` : "";
      const res = await api.get(`/student/bulletin${params}`);
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

  const { student, results } = data || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Mon Bulletin - ${student?.firstName} ${student?.lastName}`}
        description={`Matricule: ${student?.matricule} | Groupe: ${student?.group}`}
      />

      {/* Filtres */}
      <div className="flex gap-2">
        <Button
          variant={semester === null ? "default" : "outline"}
          onClick={() => setSemester(null)}
        >
          Annuel
        </Button>
        <Button
          variant={semester === "S5" ? "default" : "outline"}
          onClick={() => setSemester("S5")}
        >
          Semestre 5
        </Button>
        <Button
          variant={semester === "S6" ? "default" : "outline"}
          onClick={() => setSemester("S6")}
        >
          Semestre 6
        </Button>
      </div>

      {/* Stats */}
      {results?.type === "semester" ? (
        <SemesterBulletin results={results} />
      ) : (
        <AnnualBulletin results={results} />
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Télécharger PDF
        </Button>
      </div>
    </div>
  );
}

function SemesterBulletin({ results }: { results: any }) {
  const { semesterResult, ueResults } = results;

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Moyenne Semestre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {semesterResult?.average?.toFixed(2) || "-"}
            </div>
            <p className="text-xs text-muted-foreground">/ 20</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Crédits Validés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {semesterResult?.totalCreditsAcquired || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              / {semesterResult?.totalCredits || 30} ECTS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rang</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {semesterResult?.rank || "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              / {semesterResult?.totalStudents || "-"} étudiants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Décision</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge 
              variant={semesterResult?.decision === "ADMIS" ? "default" : "destructive"}
              className="text-lg px-3 py-1"
            >
              {semesterResult?.decision || "-"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {semesterResult?.mention}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Détail par UE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Détail par Unité d'Enseignement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ueResults?.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Aucun résultat disponible
            </p>
          ) : (
            <div className="space-y-4">
              {ueResults?.map((ue: any) => (
                <div key={ue.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{ue.UE?.name}</h4>
                      <p className="text-sm text-muted-foreground">Code: {ue.UE?.code}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{ue.average?.toFixed(2)}</div>
                      <Badge 
                        variant={ue.isValidated ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {ue.isValidated ? "Validé" : "Non validé"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Crédits: {ue.creditsAcquired} / {ue.UE?.credits || "-"}
                    {ue.isCompensated && (
                      <span className="ml-2 text-orange-500">(Compensé)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AnnualBulletin({ results }: { results: any }) {
  const { annualResult, s5Result, s6Result } = results;

  return (
    <div className="space-y-4">
      {/* Résumé Annuel */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Moyenne Annuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {annualResult?.average?.toFixed(2) || "-"}
            </div>
            <p className="text-xs text-muted-foreground">/ 20</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Crédits Totaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {annualResult?.totalCreditsAcquired || 0}
            </div>
            <p className="text-xs text-muted-foreground">/ 60 ECTS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rang Annuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {annualResult?.rank || "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              / {annualResult?.totalStudents || "-"} étudiants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Décision Finale</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge 
              variant={annualResult?.decision === "ADMIS" ? "default" : "destructive"}
              className="text-lg px-3 py-1"
            >
              {annualResult?.decision || "-"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {annualResult?.mention}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Résumé S5 & S6 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Semestre 5</CardTitle>
          </CardHeader>
          <CardContent>
            {s5Result ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Moyenne:</span>
                  <span className="font-semibold">{s5Result.average?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Crédits:</span>
                  <span className="font-semibold">{s5Result.totalCreditsAcquired} / {s5Result.totalCredits}</span>
                </div>
                <Badge variant={s5Result.decision === "ADMIS" ? "default" : "destructive"}>
                  {s5Result.decision}
                </Badge>
              </div>
            ) : (
              <p className="text-muted-foreground">Résultats non disponibles</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Semestre 6</CardTitle>
          </CardHeader>
          <CardContent>
            {s6Result ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Moyenne:</span>
                  <span className="font-semibold">{s6Result.average?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Crédits:</span>
                  <span className="font-semibold">{s6Result.totalCreditsAcquired} / {s6Result.totalCredits}</span>
                </div>
                <Badge variant={s6Result.decision === "ADMIS" ? "default" : "destructive"}>
                  {s6Result.decision}
                </Badge>
              </div>
            ) : (
              <p className="text-muted-foreground">Résultats non disponibles</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
