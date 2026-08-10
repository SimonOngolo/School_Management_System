import { Link, useRouter, useLocation } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, FileText,
  Download, LogOut, Menu, X, Bell, ChevronDown,
  Layers, Users2, Upload, UserCog, GraduationCap, FileCheck, Link2,
  UserCircle,
} from "lucide-react";
import { useAuth, type Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  to: string;
  label: string;
  icon: any;
  roles: Role[];
}

const NAV: NavItem[] = [
  // ========== DASHBOARD (Tous les rôles) ==========
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, roles: ["admin", "secretariat", "teacher", "student"] },

  // ========== ADMIN (Accès Total) ==========
  // Gestion des utilisateurs - Admin seul
  { to: "/users", label: "Utilisateurs", icon: UserCog, roles: ["admin"] },
  // Gestion des programmes - Admin seul (structure UE fixe)
  { to: "/curriculum", label: "Programmes", icon: Layers, roles: ["admin"] },
  // Affectations Enseignants - Admin seul
  { to: "/teacher-assignments", label: "Affectations Enseignants", icon: UserCircle, roles: ["admin"] },

  // ========== ADMIN & SECRÉTARIAT ==========
  // Gestion des groupes
  { to: "/groups", label: "Groupes", icon: Users2, roles: ["admin", "secretariat"] },
  // Affectations UE
  { to: "/assignments", label: "Affectations UE", icon: Link2, roles: ["admin", "secretariat"] },

  // ========== ADMIN, SECRÉTARIAT & ENSEIGNANT ==========
  // Gestion des étudiants (lecture pour enseignant)
  { to: "/students", label: "Étudiants", icon: Users, roles: ["admin", "secretariat", "teacher"] },

  // ========== SECRÉTARIAT (Gestion Administrative) ==========
  // Gestion des absences - Admin & Secrétariat (pas enseignant)
  { to: "/absences", label: "Absences", icon: ClipboardList, roles: ["admin", "secretariat"] },
  // Gestion des bulletins
  { to: "/bulletins", label: "Bulletins", icon: FileText, roles: ["admin", "secretariat"] },

  // ========== SAISIE DES NOTES ==========
  // Notes - Admin, Secrétariat & Enseignant (enseignant: uniquement ses matières)
  { to: "/grades", label: "Notes", icon: BookOpen, roles: ["admin", "secretariat", "teacher"] },
  // Groupes de l'enseignant
  { to: "/my-groups", label: "Mes Groupes", icon: Users2, roles: ["teacher"] },

  // ========== IMPORTS/EXPORTS ==========
  // Admin & Secrétariat uniquement (pas enseignant)
  { to: "/imports", label: "Imports", icon: Upload, roles: ["admin", "secretariat"] },
  { to: "/exports", label: "Exports", icon: Download, roles: ["admin", "secretariat"] },

  // ========== ÉTUDIANT (Interface Simplifiée) ==========
  // Consultation personnelle uniquement
  { to: "/my-grades", label: "Mes Notes", icon: GraduationCap, roles: ["student"] },
  { to: "/my-bulletin", label: "Mon Bulletin", icon: FileCheck, roles: ["student"] },
];

// ========== LAYOUT ÉTUDIANT SIMPLIFIÉ ==========
function StudentLayout({ user, logout, children }: { user: any; logout: () => void; children: ReactNode }) {
  const location = useLocation();
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  // Navigation simplifiée pour étudiant
  const studentNav = [
    { to: "/dashboard", label: "Mon Tableau de Bord", icon: LayoutDashboard },
    { to: "/my-grades", label: "Mes Notes", icon: GraduationCap },
    { to: "/my-bulletin", label: "Mon Bulletin", icon: FileCheck },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header simplifié pour étudiant */}
      <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
        {/* Logo + Titre */}
        <div className="flex items-center gap-3">
          <img src="/logo-inptic.png" alt="INPTIC" className="h-10 w-auto object-contain" />
          <div>
            <div className="font-semibold text-sm">LP ASUR</div>
            <div className="text-xs text-muted-foreground">INPTIC</div>
          </div>
        </div>

        {/* Navigation horizontale simplifiée */}
        <nav className="hidden md:flex items-center gap-1">
          {studentNav.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Profil étudiant */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium leading-tight">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">Étudiant</div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Menu mobile pour étudiant */}
      <div className="md:hidden border-b bg-card px-4 py-2">
        <nav className="flex items-center justify-around">
          {studentNav.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 p-2 rounded-md text-xs ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px]">{item.label.replace("Mon ", "")}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-8 max-w-[1200px] w-full mx-auto">{children}</main>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (!user) return null;
  
  // Pour les étudiants : interface simplifiée sans sidebar
  if (user.role === "student") {
    return <StudentLayout user={user} logout={logout}>{children}</StudentLayout>;
  }
  
  const items = NAV.filter((i) => i.roles.includes(user.role));
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar - Masquée pour les étudiants */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border">
          <img src="/logo-inptic.png" alt="INPTIC" className="h-10 w-auto object-contain" />
          <div>
            <div className="font-semibold text-sm">LP ASUR</div>
            <div className="text-xs text-sidebar-foreground/60">INPTIC</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto lg:hidden text-sidebar-foreground/70"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/60">
          v1.0 · Avril 2026
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center gap-4 px-4 lg:px-6 sticky top-0 z-20">
          <button
            className="lg:hidden text-foreground"
            onClick={() => setOpen(true)}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium leading-tight">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
