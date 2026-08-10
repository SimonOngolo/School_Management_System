import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { StatCard, PageHeader } from "@/components/ui-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Users, GraduationCap, BookOpen, FileText, TrendingUp,
  ClipboardList, Award, Calendar, Loader2, AlertTriangle,
  CheckCircle2, XCircle, UserCheck, Clock, Eye, Hash
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({ component: () => <ProtectedRoute><Dashboard /></ProtectedRoute> });

interface AlertItem {
  type: "missing" | "outOfRange" | "info";
  message: string;
  details?: string;
}

interface AbsenceAlert {
  studentId: number;
  studentName: string;
  totalHours: number;
  penalty: number;
}

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  promoAverage: string | null;
  bulletinsGenerated: number;
  totalAbsences: number;
  gradesThisMonth: number;
  semestersValidated: number;
  semestersTotal: number;
  latestSemester: { code: string; name: string } | null;
  semesterAverages: Record<string, { average: string; validated: number; total: number }>;
  juryDecisions: Record<string, number>;
  recentActivity: Array<{ 
    student: string; 
    type: string; 
    value: number; 
    date: string;
    enteredBy?: string;
  }>;
  alerts: AlertItem[];
  topAbsences: AbsenceAlert[];
  missingGradesCount: number;
  outOfRangeGradesCount: number;
}

interface StudentPersonalStats {
  myGrades: Array<{
    subject: string;
    type: string;
    value: number;
    semester: string;
  }>;
  myAverage: string;
  myRank: number;
  totalStudents: number;
  myAbsences: number;
  myAbsencePenalty: number;
}

interface TeacherSubjectStats {
  subjects: Array<{
    id: number;
    name: string;
    coefficient: number;
    studentCount: number;
    averageGrade: string;
  }>;
  groups: string[];
  totalStudents: number;
}

function useDashboardStats(semester?: string) {
  return useQuery({
    queryKey: ["stats-dashboard", semester],
    queryFn: async () => {
      const params = semester ? `?semester=${semester}` : "";
      const res = await api.get(`/stats/dashboard${params}`);
      return res.data.data as DashboardStats;
    },
  });
}

function useStudentPersonalStats() {
  return useQuery({
    queryKey: ["student-personal-stats"],
    queryFn: async () => {
      const res = await api.get("/stats/student/personal");
      return res.data.data as StudentPersonalStats;
    },
  });
}

function useTeacherSubjectStats() {
  return useQuery({
    queryKey: ["teacher-subject-stats"],
    queryFn: async () => {
      const res = await api.get("/stats/teacher/subjects");
      return res.data.data as TeacherSubjectStats;
    },
  });
}

function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "admin") return <AdminDash />;
  if (user.role === "teacher") return <TeacherDash />;
  if (user.role === "secretariat") return <SecretariatDash />;
  return <StudentDash />;
}

function AdminDash() {
  const [semester, setSemester] = useState<"S5" | "S6" | "ANNUAL">("ANNUAL");
  const { data: stats, isLoading } = useDashboardStats(semester);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const s = stats ?? ({} as DashboardStats);

  return (
    <>
      <PageHeader title="Tableau de bord administrateur" description="Vue d'ensemble de la promotion LP ASUR" />
      
      {/* Semester Filter Tabs */}
      <Tabs value={semester} onValueChange={(v) => setSemester(v as any)} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="S5">Semestre 5</TabsTrigger>
          <TabsTrigger value="S6">Semestre 6</TabsTrigger>
          <TabsTrigger value="ANNUAL">Annuel</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Étudiants inscrits" value={String(s.totalStudents ?? 0)} icon={<Users className="h-5 w-5" />} />
        <StatCard 
          label={semester === "ANNUAL" ? "Moyenne annuelle" : `Moyenne ${semester}`} 
          value={s.promoAverage ?? "—"} 
          icon={<TrendingUp className="h-5 w-5" />} 
          trend={semester === "ANNUAL" ? "Moy. S5 + S6 / 2" : s.latestSemester?.code || ""} 
          accent="warning" 
        />
        <StatCard 
          label="Alertes cohérence" 
          value={String((s.missingGradesCount ?? 0) + (s.outOfRangeGradesCount ?? 0))} 
          icon={<AlertTriangle className="h-5 w-5" />} 
          accent={(s.missingGradesCount ?? 0) + (s.outOfRangeGradesCount ?? 0) > 0 ? "destructive" : "success"}
        />
        <StatCard 
          label="Absences totales" 
          value={String(s.totalAbsences ?? 0)} 
          icon={<Clock className="h-5 w-5" />} 
          accent="warning"
        />
      </div>

      {/* Alerts & Absences Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Alertes Cohérence Widget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alertes de Cohérence
            </CardTitle>
            <Badge variant={((s.missingGradesCount ?? 0) + (s.outOfRangeGradesCount ?? 0)) > 0 ? "destructive" : "default"}>
              {((s.missingGradesCount ?? 0) + (s.outOfRangeGradesCount ?? 0))} alertes
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {(s.missingGradesCount ?? 0) > 0 && (
              <Alert variant="default" className="border-l-4 border-l-amber-500">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Notes manquantes</AlertTitle>
                <AlertDescription>
                  {s.missingGradesCount} notes de CC ou Examen sont manquantes pour {semester === "ANNUAL" ? "l'année" : `le ${semester}`}
                </AlertDescription>
              </Alert>
            )}
            {(s.outOfRangeGradesCount ?? 0) > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Notes hors barème</AlertTitle>
                <AlertDescription>
                  {s.outOfRangeGradesCount} notes dépassent 20 points - vérification requise
                </AlertDescription>
              </Alert>
            )}
            {((s.missingGradesCount ?? 0) + (s.outOfRangeGradesCount ?? 0)) === 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span>Aucune anomalie détectée - données cohérentes</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Absences Alert Widget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              Alerte Absences
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!s.topAbsences || s.topAbsences.length === 0) ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Aucune absence enregistrée
              </div>
            ) : (
              <div className="space-y-3">
                {s.topAbsences.slice(0, 5).map((abs, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-sm font-bold text-red-600">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{abs.studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {abs.totalHours} heures d'absence
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="text-xs">
                        -{(abs.penalty * 100).toFixed(0)} pts
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        pénalité sur moyenne
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Activité récente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(!s.recentActivity || s.recentActivity.length === 0) ? (
              <div className="text-sm text-muted-foreground text-center py-4">Aucune activité récente</div>
            ) : (
              s.recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground">
                    {a.student.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{a.student}</span>{" "}
                    <span className="text-muted-foreground">note {a.type} : {a.value}/20</span>
                    {a.enteredBy && (
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        Saisie par: {a.enteredBy}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {a.date ? new Date(a.date).toLocaleDateString("fr-FR") : ""}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Décisions jury</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <RowStat label="Diplômés" value={s.juryDecisions?.DIPLÔMÉ ?? 0} color="bg-success" />
            <RowStat label="Reprise soutenance" value={s.juryDecisions?.REPRISE_SOUTENANCE ?? 0} color="bg-warning" />
            <RowStat label="Redoublants" value={s.juryDecisions?.REDOUBLE ?? 0} color="bg-destructive" />
            <RowStat label="Non diplômés" value={s.juryDecisions?.NON_DIPLÔMÉ ?? 0} color="bg-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function RowStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function TeacherDash() {
  const { data: stats, isLoading } = useTeacherSubjectStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const s = stats ?? ({} as TeacherSubjectStats);

  return (
    <>
      <PageHeader title="Espace enseignant" description="Vos matières et groupes assignés" />
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard 
          label="Matères enseignées" 
          value={String(s.subjects?.length ?? 0)} 
          icon={<BookOpen className="h-5 w-5" />} 
          accent="success" 
        />
        <StatCard 
          label="Groupes assignés" 
          value={String(s.groups?.length ?? 0)} 
          icon={<Users className="h-5 w-5" />} 
          accent="warning" 
        />
        <StatCard 
          label="Étudiants concernés" 
          value={String(s.totalStudents ?? 0)} 
          icon={<GraduationCap className="h-5 w-5" />} 
        />
      </div>

      {/* My Subjects */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Mes Matières
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {(!s.subjects || s.subjects.length === 0) ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Aucune matière assignée
            </div>
          ) : (
            s.subjects.map((subject) => (
              <div key={subject.id} className="py-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                  {subject.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{subject.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {subject.studentCount} étudiants • Coef. {subject.coefficient}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{subject.averageGrade}</div>
                  <div className="text-xs text-muted-foreground">moyenne</div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* My Groups */}
      {s.groups && s.groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mes Groupes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {s.groups.map((group, i) => (
                <Badge key={i} variant="secondary">{group}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function SecretariatDash() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const s = stats ?? ({} as DashboardStats);

  return (
    <>
      <PageHeader title="Secrétariat pédagogique" description="Gestion administrative de la promotion" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Étudiants" value={String(s.totalStudents ?? 0)} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Notes ce mois" value={String(s.gradesThisMonth ?? 0)} icon={<BookOpen className="h-5 w-5" />} accent="success" />
        <StatCard label="Absences (h)" value={String(s.totalAbsences ?? 0)} icon={<ClipboardList className="h-5 w-5" />} accent="warning" />
      </div>
    </>
  );
}

function StudentDash() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useStudentPersonalStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const s = stats ?? ({} as StudentPersonalStats);

  const mention = s.myAverage
    ? parseFloat(s.myAverage) >= 16 ? "Très Bien"
      : parseFloat(s.myAverage) >= 14 ? "Bien"
      : parseFloat(s.myAverage) >= 12 ? "Assez Bien"
      : parseFloat(s.myAverage) >= 10 ? "Passable" : "—"
    : "—";

  const mentionCode = mention !== "—" ? mention.split(" ").map(w => w[0]).join("") : "—";

  return (
    <>
      <PageHeader 
        title={`Bonjour, ${user?.firstName || 'Étudiant'}`} 
        description="Voici votre suivi académique personnel" 
      />
      
      {/* Personal Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <StatCard 
          label="Ma moyenne" 
          value={s.myAverage ?? "—"} 
          icon={<TrendingUp className="h-5 w-5" />} 
          accent="success" 
        />
        <StatCard 
          label="Mon rang" 
          value={s.myRank ? `${s.myRank}/${s.totalStudents}` : "—"} 
          icon={<Hash className="h-5 w-5" />} 
          accent="warning"
        />
        <StatCard 
          label="Mes absences" 
          value={String(s.myAbsences ?? 0)} 
          icon={<Clock className="h-5 w-5" />} 
          accent={(s.myAbsences ?? 0) > 10 ? "destructive" : "default"}
        />
        <StatCard 
          label="Pénalité absences" 
          value={s.myAbsencePenalty ? `-${(s.myAbsencePenalty * 100).toFixed(1)} pts` : "0"} 
          icon={<AlertTriangle className="h-5 w-5" />} 
          accent={(s.myAbsencePenalty ?? 0) > 0 ? "destructive" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mention Card */}
        <Card>
          <CardHeader><CardTitle>Mention actuelle</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl bg-gradient-to-br from-primary to-primary/70">
                {mentionCode}
              </div>
              <div>
                <div className="text-2xl font-bold">{mention}</div>
                <div className="text-muted-foreground text-sm">
                  Basée sur votre moyenne de {s.myAverage ?? "—"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grades List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Mes Notes récentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(!s.myGrades || s.myGrades.length === 0) ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Aucune note disponible
              </div>
            ) : (
              s.myGrades.slice(0, 5).map((grade, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{grade.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {grade.type} • {grade.semester}
                    </p>
                  </div>
                  <Badge 
                    variant={grade.value >= 10 ? "default" : "destructive"}
                    className="text-sm"
                  >
                    {grade.value}/20
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
