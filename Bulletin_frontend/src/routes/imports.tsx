import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui-kit";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/imports")({
  component: () => <ProtectedRoute roles={["admin", "secretariat"] }><ImportsPage /></ProtectedRoute>,
});

function ImportsPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"grades" | "students">("grades");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Veuillez sélectionner un fichier Excel (.xlsx)");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const endpoint = uploadType === "grades" ? "/import-export/grades" : "/import-export/students";
      const res = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data.data;
      toast.success(
        `Import terminé : ${data.success} réussis, ${data.errors} échecs`,
        { description: data.details?.length > 0 ? data.details.slice(0, 3).map((d: any) => d.error || d.matricule).join(", ") : undefined },
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur lors de l'import");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const importConfigs = [
    {
      key: "grades",
      title: "Importer des notes",
      desc: "Format attendu : Matricule | Matière | CC | Examen | Rattrapage",
      icon: FileSpreadsheet,
    },
    {
      key: "students",
      title: "Importer des étudiants",
      desc: "Format attendu : Matricule | Nom | Prénom | Date naiss | Lieu naiss | Bac | École origine | Groupe | Année académique",
      icon: Upload,
    },
  ];

  return (
    <>
      <PageHeader title="Imports" description="Importation des données depuis Excel" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {importConfigs.map((config) => (
          <Card key={config.key} className={uploadType === config.key ? "ring-2 ring-primary" : ""}>
            <CardContent className="p-6">
              <div className="flex gap-4 mb-4">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <config.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{config.title}</div>
                  <p className="text-sm text-muted-foreground mt-1">{config.desc}</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <input
                  ref={uploadType === config.key ? fileInputRef : null}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  className="hidden"
                  id={`excel-upload-${config.key}`}
                  title={`Importer ${config.title}`}
                />
                <Button
                  size="sm"
                  variant={uploadType === config.key ? "default" : "outline"}
                  onClick={() => {
                    setUploadType(config.key as "grades" | "students");
                    setTimeout(() => fileInputRef.current?.click(), 0);
                  }}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading && uploadType === config.key ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1.5" />
                  )}
                  {uploading && uploadType === config.key ? "Import en cours..." : `Importer ${config.title.toLowerCase()}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
