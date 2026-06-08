import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { RoleLayout } from "@/components/common/RoleLayout";
import { LayoutDashboard, Rabbit, Flag, ClipboardList, Send, BarChart3, Trophy } from "lucide-react";

const menu = [
  { to: "/owner/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/owner/my-horses", label: "My Horses", icon: <Rabbit className="h-4 w-4" /> },
  { to: "/owner/race-registration", label: "Race Registration", icon: <Flag className="h-4 w-4" /> },
  { to: "/owner/my-registrations", label: "My Registrations", icon: <ClipboardList className="h-4 w-4" /> },
  { to: "/owner/jockey-invitations", label: "Jockey Invitations", icon: <Send className="h-4 w-4" /> },
  { to: "/owner/horse-performance", label: "Horse Performance", icon: <BarChart3 className="h-4 w-4" /> },
  { to: "/owner/awards", label: "Awards & Prize", icon: <Trophy className="h-4 w-4" /> },
];

export const Route = createFileRoute("/owner")({
  component: () => (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <RoleLayout menu={menu} />
    </ProtectedRoute>
  ),
});
