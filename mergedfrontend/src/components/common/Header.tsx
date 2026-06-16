import { LogOut, UserCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/auth/AuthContext";
import { NotificationBell } from "@/lib/notifications";
import type { Role } from "@/data/mockUsers";

const envName: Record<Role, string> = {
  ADMIN: "Admin Environment",
  REFEREE: "Race Referee Environment",
  OWNER: "Horse Owner Environment",
  JOCKEY: "Jockey Environment",
  SPECTATOR: "Spectator Environment",
};

const roleLabel: Record<Role, string> = {
  ADMIN: "Admin",
  REFEREE: "Race Referee",
  OWNER: "Horse Owner",
  JOCKEY: "Jockey",
  SPECTATOR: "Spectator",
};


export function Header() {
  const { currentUser, logout } = useAuth();
  if (!currentUser) return null;
  const initial = currentUser.name.charAt(0).toUpperCase();

  return (
    <header className="bg-card border-b border-border px-8 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{envName[currentUser.role]}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Horse Racing Tournament Management System</p>
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <Link to="/profile" className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-accent transition-colors" title="View profile">
          <div className="text-right">
            <div className="text-sm font-medium text-foreground">{currentUser.name}</div>
            <div className="text-xs text-muted-foreground">{roleLabel[currentUser.role]}</div>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
            {initial}
          </div>
        </Link>
        <Link to="/profile" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors" title="Profile">
          <UserCircle className="h-4 w-4" /> Profile
        </Link>
        <button
          onClick={() => { logout(); window.location.href = "/login"; }}
          className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
