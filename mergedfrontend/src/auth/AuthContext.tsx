import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { mockUsers, type MockUser, type Role } from "@/data/mockUsers";

export type AuthUser = Omit<MockUser, "password">;

interface SignupInput {
  username: string;
  password: string;
  name: string;
}

interface AuthContextValue {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => { ok: true; user: AuthUser } | { ok: false; error: string };
  signupSpectator: (input: SignupInput) => { ok: true; user: AuthUser } | { ok: false; error: string };
  resetPassword: (username: string, newPassword: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  getDashboardPathByRole: (role: Role) => string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "currentUser";
const SIGNUP_USERS_KEY = "signupUsers";

export function getDashboardPathByRole(role: Role): string {
  switch (role) {
    case "ADMIN": return "/admin/dashboard";
    case "REFEREE": return "/referee/dashboard";
    case "OWNER": return "/owner/dashboard";
    case "JOCKEY": return "/jockey/dashboard";
    case "SPECTATOR": return "/spectator/dashboard";
  }
}

function loadSignupUsers(): MockUser[] {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(SIGNUP_USERS_KEY) : null;
    return raw ? (JSON.parse(raw) as MockUser[]) : [];
  } catch { return []; }
}

function saveSignupUsers(list: MockUser[]) {
  try { window.localStorage.setItem(SIGNUP_USERS_KEY, JSON.stringify(list)); } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [signupUsers, setSignupUsers] = useState<MockUser[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch {}
    setSignupUsers(loadSignupUsers());
    setHydrated(true);
  }, []);

  const allUsers = (): MockUser[] => [...mockUsers, ...signupUsers];

  const login: AuthContextValue["login"] = (username, password) => {
    const found = allUsers().find(u => u.username === username && u.password === password);
    if (!found) return { ok: false, error: "Invalid username or password" };
    const user: AuthUser = { username: found.username, role: found.role, name: found.name };
    setCurrentUser(user);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch {}
    return { ok: true, user };
  };

  const signupSpectator: AuthContextValue["signupSpectator"] = ({ username, password, name }) => {
    const uname = username.trim();
    const dname = name.trim();
    if (uname.length < 3) return { ok: false, error: "Tên đăng nhập phải có ít nhất 3 ký tự" };
    if (!/^[a-zA-Z0-9_]+$/.test(uname)) return { ok: false, error: "Tên đăng nhập chỉ gồm chữ, số, dấu gạch dưới" };
    if (password.length < 6) return { ok: false, error: "Mật khẩu phải có ít nhất 6 ký tự" };
    if (dname.length < 2) return { ok: false, error: "Vui lòng nhập họ tên hiển thị" };
    if (allUsers().some(u => u.username.toLowerCase() === uname.toLowerCase())) {
      return { ok: false, error: "Tên đăng nhập đã tồn tại" };
    }
    const newUser: MockUser = { username: uname, password, name: dname, role: "SPECTATOR" };
    const next = [...signupUsers, newUser];
    setSignupUsers(next);
    saveSignupUsers(next);
    const user: AuthUser = { username: newUser.username, role: newUser.role, name: newUser.name };
    setCurrentUser(user);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch {}
    return { ok: true, user };
  };

  const resetPassword: AuthContextValue["resetPassword"] = (username, newPassword) => {
    const uname = username.trim();
    if (!uname) return { ok: false, error: "Vui lòng nhập tên đăng nhập" };
    if (newPassword.length < 6) return { ok: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự" };
    const idx = signupUsers.findIndex(u => u.username.toLowerCase() === uname.toLowerCase());
    if (idx === -1) {
      if (mockUsers.some(u => u.username.toLowerCase() === uname.toLowerCase())) {
        return { ok: false, error: "Tài khoản demo không thể đổi mật khẩu" };
      }
      return { ok: false, error: "Không tìm thấy tài khoản" };
    }
    const next = [...signupUsers];
    next[idx] = { ...next[idx], password: newPassword };
    setSignupUsers(next);
    saveSignupUsers(next);
    return { ok: true };
  };

  const logout = () => {
    setCurrentUser(null);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  if (!hydrated) {
    return <div className="min-h-screen bg-background" />;
  }

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
