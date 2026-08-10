import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui-kit";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Download, FileSpreadsheet, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/exports")({
  component: () => <ProtectedRoute roles={["admin", "secretariat"]}><ExportsPage /></ProtectedRoute>,
});

interface Semester {
  id: number; name: string; code: string; academicYear: string;
}

interface Group {
  id: number; name: string; academicYear: string;
}

function ExportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");

  const { data: semesters = [] } = useQuery({
    queryKey: ["semesters"],
    queryFn: async () => {
      const res = await api.get("/bulletins/semesters");
      return res.data.data as Semester[];
    },
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await api.get("/groups");
      return res.data.data as Group[];
    },
  });

  const downloadFile = async (url: string, filename: string, key: string) => {
    setDownloading(key);
    try {
      const fullUrl = selectedGroupId && selectedGroupId !== "all" ? `${url}${url.includes("?") ? "&" : "?"}groupId=${selectedGroupId}` : url;
      const res = await api.get(fullUrl, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Fichier téléchargé");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur lors du téléchargement");
    } finally {
      setDownloading(null);
    }
  };

  const getExportUrl = (baseEndpoint: string) => {
    const params = new URLSearchParams();
    if (selectedGroupId && selectedGroupId !== "all") params.append("groupId", selectedGroupId);
    const queryString = params.toString();
    return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
  };

  const exports = [
    {
      key: "jury",
      title: "Décisions du jury",
      desc: "Export Excel des décisions finales (diplômé, soutenance, redoublement)",
      endpoint: "/import-export/jury",
      filename: `decisions_jury${selectedGroupId && selectedGroupId !== "all" ? `_${groups.find(g => String(g.id) === selectedGroupId)?.name || selectedGroupId}` : ""}.xlsx`,
    },
    {
      key: `semester-${selectedSemesterId}`,
      title: "Relevé semestriel",
      desc: "Notes complètes et moyennes par UE pour le semestre sélectionné",
      endpoint: selectedSemesterId ? `/import-export/semester/${selectedSemesterId}` : null,
      filename: selectedSemesterId ? `releve_${semesters.find(s => String(s.id) === selectedSemesterId)?.code || selectedSemesterId}${selectedGroupId && selectedGroupId !== "all" ? `_${groups.find(g => String(g.id) === selectedGroupId)?.name || selectedGroupId}` : ""}.xlsx` : null,
    },
  ];

  return (
    <>
      <PageHeader title="Exports" description="Téléchargement des relevés et décisions au format Excel" />

      {/* Sélecteurs de filtre */}
      <Card className="mb-4">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-xs">
            <Label className="text-sm font-medium mb-1.5 block">Groupe (optionnel) :</Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les groupes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les groupes</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {g.name} ({g.academicYear})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 max-w-xs">
            <Label className="text-sm font-medium mb-1.5 block">Semestre pour le relevé :</Label>
            <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un semestre" /></SelectTrigger>
              <SelectContent>
                {semesters.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} ({s.code}) — {s.academicYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cartes d'export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exports.map((e) => (
          <Card key={e.key}>
            <CardContent className="p-6 flex gap-4">
              <div className="h-11 w-11 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{e.title}</div>
                <p className="text-sm text-muted-foreground mt-1">{e.desc}</p>
                <Button
                  className="mt-4"
                  size="sm"
                  disabled={!e.endpoint || downloading === e.key}
                  onClick={() => e.endpoint && e.filename && downloadFile(e.endpoint, e.filename, e.key)}
                >
                  {downloading === e.key ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Download className="h-4 w-4 mr-1.5" />
                  )}
                  Télécharger
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={className}>{children}</label>;
}
