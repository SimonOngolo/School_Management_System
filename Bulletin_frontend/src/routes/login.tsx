import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Helper: Redirection selon le rôle
const getDashboardByRole = (role: string): string => {
  switch (role) {
    case "admin":
      return "/dashboard"; // Dashboard admin complet
    case "secretariat":
      return "/dashboard"; // Dashboard secrétariat
    case "teacher":
      return "/dashboard"; // Dashboard enseignant
    case "student":
      return "/dashboard"; // Dashboard étudiant (simplifié)
    default:
      return "/dashboard";
  }
};

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Connexion — LP ASUR INPTIC" }] }),
});

function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Redirection selon le rôle après connexion
  useEffect(() => {
    if (user) {
      const redirectPath = getDashboardByRole(user.role);
      navigate({ to: redirectPath });
    }
  }, [user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const loggedUser = await login(email, password, remember);
      toast.success("Connexion réussie");
      // Redirection selon le rôle
      const redirectPath = getDashboardByRole(loggedUser?.role || user?.role);
      navigate({ to: redirectPath });
    } catch (err: any) {
      toast.error(err.message || "Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: "var(--gradient-primary)" }}>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 70%, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <img src="/logo-inptic.png" alt="INPTIC" className="h-12 w-auto object-contain" />
            <div>
              <div className="font-semibold">LP ASUR</div>
              <div className="text-xs text-white/70">INPTIC</div>
            </div>
          </div>
          <div className="space-y-4 max-w-md">
            <h2 className="text-4xl font-bold leading-tight">
              Gestion universitaire
            </h2>
            <p className="text-white/80 text-lg">
              Plateforme centralisée pour la saisie des notes, la génération de bulletins et le suivi pédagogique.
            </p>
          </div>
          <p className="text-xs text-white/60"> 2026 INPTIC — Tous droits réservés</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <img src="/logo-inptic.png" alt="INPTIC" className="h-12 w-auto object-contain" />
            <div>
              <div className="font-semibold">LP ASUR</div>
              <div className="text-xs text-muted-foreground">INPTIC</div>
            </div>
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Bienvenue</h1>
          <p className="text-muted-foreground mt-2">Connectez-vous à votre espace</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@inptic.ga" className="pl-9 h-11" autoComplete="email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" className="pl-9 h-11" autoComplete="current-password" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                Se souvenir de moi
              </label>
              <a href="#" className="text-sm text-primary hover:underline">Mot de passe oublié ?</a>
            </div>

            <Button type="submit" disabled={submitting} className="w-full h-11 text-base font-semibold">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Se connecter
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
