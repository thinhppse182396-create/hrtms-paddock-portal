import { Outlet } from "@tanstack/react-router";
import { Sidebar, type MenuItem } from "./Sidebar";
import { Header } from "./Header";

export function RoleLayout({ menu }: { menu: MenuItem[] }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={menu} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-8">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
