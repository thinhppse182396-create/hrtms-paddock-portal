import { Link, useLocation } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import type { ReactNode } from "react";

export interface MenuItem {
  to: string;
  label: string;
  icon?: ReactNode;
}

export function Sidebar({ items }: { items: MenuItem[] }) {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-white/10">
        <h1 className="text-lg font-bold text-white tracking-tight">Racing Portal</h1>
        <p className="text-xs text-sidebar-foreground/70 mt-1">Tournament Management</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(item => {
          const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-sidebar-active text-white shadow-[0_4px_14px_-4px_rgba(37,99,235,0.5)]"
                  : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-white hover:translate-x-0.5"
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-white" />}
              <span className="transition-transform group-hover:scale-110">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => { logout(); window.location.href = "/login"; }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-hover hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
