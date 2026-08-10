import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui-kit";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Eye, Loader2, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { StudentSearch } from "@/components/StudentSearch";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/bulletins")({
  component: () => <ProtectedRoute roles={["admin", "secretariat", "student"]}><BulletinsPage /></ProtectedRoute>,
});

interface Semester {
  id: number; name: string; code: string; academicYear: string; totalCredits: number;
}

interface Student {
  id: number; matricule: string; firstName: string; lastName: string;
  Group?: { name: string };
}

function BulletinsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [downloading, setDownloading] = useState<string | null>(null);

  const isStudent = user?.role === "student";

  const { data: students = [], isLoading: loadingStudents, refetch: refetchStudents } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await api.get("/students");
      return res.data.data as Student[];
    },
    enabled: !isStudent,
  });

  const { data: semesters = [], isLoading: loadingSemesters, refetch: refetchSemesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: async () => {
      const res = await api.get("/bulletins/semesters");
      return res.data.data as Semester[];
    },
  });

  // Filtrer les étudiants selon la recherche
  const filteredStudents = students.filter((s) =>
    `${s.matricule} ${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["students"] });
    await queryClient.invalidateQueries({ queryKey: ["semesters"] });
    toast.success("Données actualisées");
  };

  const studentId = isStudent ? String(user?.id) : selectedStudentId;


  const downloadPdf = async (url: string, filename: string, key: string) => {
    if (!studentId) {
      toast.error("Sélectionnez un étudiant");
      return;
    }
    setDownloading(key);
    try {
      // Ajout d'un timestamp pour éviter le cache
      const cacheBustUrl = `${url}?t=${Date.now()}`;
      const res = await api.get(cacheBustUrl, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Bulletin téléchargé");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur lors du téléchargement");
    } finally {
      setDownloading(null);
    }
  };

  const viewPdf = async (url: string, key: string) => {
    if (!studentId) {
      toast.error("Sélectionnez un étudiant");
      return;
    }
    setDownloading(key);
    try {
      // Ajout d'un timestamp pour éviter le cache
      const cacheBustUrl = `${url}?t=${Date.now()}`;
      const res = await api.get(cacheBustUrl, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(res.data);
      window.open(blobUrl, "_blank");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur lors de l'ouverture");
    } finally {
      setDownloading(null);
    }
  };

  const isLoading = loadingStudents || loadingSemesters;

  return (
    <>
      <PageHeader title="Bulletins" description="Consultation et téléchargement des bulletins" />

      {!isStudent && (
        <Card className="mb-4">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-start">
            <div className="flex-1 max-w-md">
              <StudentSearch
                students={students}
                value={selectedStudentId}
                onChange={setSelectedStudentId}
                placeholder="Rechercher un étudiant (nom, prénom, matricule)..."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {!studentId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Sélectionnez un étudiant pour voir ses bulletins
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {semesters.map((sem) => {
            const key = `sem-${sem.id}`;
            const isDownloading = downloading === key;
            return (
              <Card key={sem.id} className="hover:shadow-[var(--shadow-elegant)] transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary">{sem.totalCredits} crédits</Badge>
                  </div>
                  <div className="font-semibold">{sem.name}</div>
                  <div className="text-sm text-muted-foreground mb-4">{sem.academicYear || "—"}</div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      disabled={isDownloading}
                      onClick={() => viewPdf(`/bulletins/student/${studentId}/semester/${sem.id}`, key)}
                    >
                      {isDownloading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Eye className="h-4 w-4 mr-1.5" />}
                      Voir
                    </Button>
                    <Button
                      className="flex-1"
                      size="sm"
                      disabled={isDownloading}
                      onClick={() => downloadPdf(
                        `/bulletins/student/${studentId}/semester/${sem.id}`,
                        `bulletin_${sem.code}.pdf`,
                        key,
                      )}
                    >
                      <Download className="h-4 w-4 mr-1.5" /> PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Bulletin annuel */}
          <Card className="hover:shadow-[var(--shadow-elegant)] transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-11 w-11 rounded-lg bg-success/10 text-success flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <Badge variant="default">Annuel</Badge>
              </div>
              <div className="font-semibold">Bulletin annuel</div>
              <div className="text-sm text-muted-foreground mb-4">2024-2025</div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  size="sm"
                  disabled={downloading === "annual"}
                  onClick={() => viewPdf(`/bulletins/student/${studentId}/annual/2024-2025`, "annual")}
                >
                  {downloading === "annual" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Eye className="h-4 w-4 mr-1.5" />}
                  Voir
                </Button>
                <Button
                  className="flex-1"
                  size="sm"
                  disabled={downloading === "annual"}
                  onClick={() => downloadPdf(
                    `/bulletins/student/${studentId}/annual/2024-2025`,
                    `bulletin_annuel_2024-2025.pdf`,
                    "annual",
                  )}
                >
                  <Download className="h-4 w-4 mr-1.5" /> PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
