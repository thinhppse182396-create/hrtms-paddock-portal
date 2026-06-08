import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  changePasswordWithBackend,
  loginWithBackend,
  registerSpectatorWithBackend,
} from "@/lib/backendApi";

export type Role = "ADMIN" | "REFEREE" | "OWNER" | "JOCKEY" | "SPECTATOR";

export interface AuthUser {
  accountId: string;
  username: string;
  role: Role;
  name: string;
}

interface SignupInput {
  username: string;
  password: string;
  name: string;
}

interface AuthContextValue {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }>;
  signupSpectator: (input: SignupInput) => Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }>;
  resetPassword: (username: string, currentPassword: string, newPassword: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  getDashboardPathByRole: (role: Role) => string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "currentUser";

export function getDashboardPathByRole(role: Role): string {
  switch (role) {
    case "ADMIN": return "/admin/dashboard";
    case "REFEREE": return "/referee/dashboard";
    case "OWNER": return "/owner/dashboard";
    case "JOCKEY": return "/jockey/dashboard";
    case "SPECTATOR": return "/spectator/dashboard";
  }
}

function toAuthUser(found: {
  accountId: string;
  username: string;
  fullName: string;
  roleCode: "ADMIN" | "REFEREE" | "JOCKEY" | "HORSE_OWNER" | "SPECTATOR";
}): AuthUser {
  return {
    accountId: found.accountId,
    username: found.username,
    role: found.roleCode === "HORSE_OWNER" ? "OWNER" : found.roleCode,
    name: found.fullName,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  const remember = (user: AuthUser) => {
    setCurrentUser(user);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch {}
  };

  const login: AuthContextValue["login"] = async (username, password) => {
    try {
      const user = toAuthUser(await loginWithBackend(username.trim(), password));
      remember(user);
      return { ok: true, user };
    } catch (error: any) {
      return { ok: false, error: error?.message ?? "Backend login failed" };
    }
  };

  const signupSpectator: AuthContextValue["signupSpectator"] = async ({ username, password, name }) => {
    const uname = username.trim();
    const displayName = name.trim();
    if (uname.length < 3) return { ok: false, error: "Username must contain at least 3 characters." };
    if (!/^[a-zA-Z0-9_]+$/.test(uname)) return { ok: false, error: "Username may contain only letters, numbers and underscores." };
    if (password.length < 6) return { ok: false, error: "Password must contain at least 6 characters." };
    if (displayName.length < 2) return { ok: false, error: "Please enter your display name." };

    try {
      const user = toAuthUser(await registerSpectatorWithBackend(uname, password, displayName));
      remember(user);
      return { ok: true, user };
    } catch (error: any) {
      return { ok: false, error: error?.message ?? "Registration failed" };
    }
  };

  const resetPassword: AuthContextValue["resetPassword"] = async (username, currentPassword, newPassword) => {
    if (newPassword.length < 6) return { ok: false, error: "New password must contain at least 6 characters." };
    try {
      await changePasswordWithBackend(username.trim(), currentPassword, newPassword);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error?.message ?? "Password update failed" };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  if (!hydrated) return <div className="min-h-screen bg-background" />;

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      login,
      signupSpectator,
      resetPassword,
      logout,
      getDashboardPathByRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
