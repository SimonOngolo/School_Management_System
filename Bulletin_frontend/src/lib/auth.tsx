import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";

export type Role = "admin" | "teacher" | "secretariat" | "student";

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USERS: Record<string, { password: string; user: AuthUser }> = {
  "admin@inptic.ga": {
    password: "123admin",
    user: { id: 1, email: "admin@inptic.ga", role: "admin", firstName: "Administrateur", lastName: "Principal" },
  },
  "teacher@inptic.ga": {
    password: "teacher123",
    user: { id: 2, email: "teacher@inptic.ga", role: "teacher", firstName: "Jean", lastName: "Mboumba" },
  },
  "secretariat@inptic.ga": {
    password: "secret123",
    user: { id: 3, email: "secretariat@inptic.ga", role: "secretariat", firstName: "Marie", lastName: "Ondo" },
  },
  "student@inptic.ga": {
    password: "student123",
    user: { id: 4, email: "student@inptic.ga", role: "student", firstName: "Paul", lastName: "Nguema" },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = localStorage.getItem("asur_token");
    const u = localStorage.getItem("asur_user");
    if (t && u) {
      try {
        setToken(t);
        setUser(JSON.parse(u));
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, remember = true) => {
    let userData: AuthUser;
    let jwt: string;

    try {
      const res = await api.post("/auth/login", { email, password });
      const data = res.data?.data ?? res.data;
      jwt = data.token;
      userData = data.user;
    } catch (err: any) {
      // Fallback: demo accounts when backend unreachable
      const demo = DEMO_USERS[email.toLowerCase()];
      if (demo && demo.password === password) {
        userData = demo.user;
        jwt = "demo-token-" + demo.user.role;
      } else {
        throw new Error(
          err?.response?.data?.message ||
            "Identifiants invalides ou serveur injoignable",
        );
      }
    }

    if (remember) {
      localStorage.setItem("asur_token", jwt);
      localStorage.setItem("asur_user", JSON.stringify(userData));
    }
    setToken(jwt);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("asur_token");
    localStorage.removeItem("asur_user");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
