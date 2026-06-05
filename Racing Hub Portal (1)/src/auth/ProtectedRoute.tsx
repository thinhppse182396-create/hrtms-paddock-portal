import { Link, Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth, getDashboardPathByRole, type Role } from "./AuthContext";
import { ShieldAlert, LogOut, ArrowRight } from "lucide-react";

export function ProtectedRoute({ allowedRoles, children }: { allowedRoles: Role[]; children: ReactNode }) {
  const { currentUser, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    const target = getDashboardPathByRole(currentUser.role);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center shadow-lg">
          <div className="mx-auto h-14 w-14 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center mb-4">
            <ShieldAlert className="h-7 w-7 text-danger" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">Truy cập bị từ chối</h1>
          <p className="text-sm text-muted-foreground mb-1">
            Trang này chỉ dành cho vai trò:&nbsp;
            <span className="font-semibold text-foreground">{allowedRoles.join(", ")}</span>.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Bạn đang đăng nhập với vai trò&nbsp;
            <span className="font-semibold text-foreground">{currentUser.role}</span>
            &nbsp;({currentUser.name}).
          </p>
          <div className="flex flex-col gap-2">
            <Link to={target} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition">
              Về dashboard của tôi <ArrowRight className="h-4 w-4" />
            </Link>
            <button onClick={logout} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-input bg-card hover:bg-accent text-sm text-foreground transition">
              <LogOut className="h-4 w-4" /> Đăng xuất & đổi tài khoản
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
