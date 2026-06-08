import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { RoleLayout } from "@/components/common/RoleLayout";
import { LayoutDashboard, Trophy, Flag, ClipboardList, Users, Award, UserCog, Gift, BarChart3, ScrollText, Route as RouteIcon, UserCheck } from "lucide-react";

const menu = [
  { to: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/admin/tracks", label: "Tracks", icon: <RouteIcon className="h-4 w-4" /> },
  { to: "/admin/tournaments", label: "Tournaments", icon: <Trophy className="h-4 w-4" /> },
  { to: "/admin/races", label: "Races", icon: <Flag className="h-4 w-4" /> },
  { to: "/admin/registrations", label: "Registrations", icon: <ClipboardList className="h-4 w-4" /> },
  { to: "/admin/pending-approvals", label: "Pending Approvals", icon: <UserCheck className="h-4 w-4" /> },
  { to: "/admin/referees", label: "Referees", icon: <Users className="h-4 w-4" /> },
  { to: "/admin/results", label: "Publish Results", icon: <Award className="h-4 w-4" /> },
  { to: "/admin/awards", label: "Awards & Ceremony", icon: <Gift className="h-4 w-4" /> },
  { to: "/admin/analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { to: "/admin/audit-log", label: "Audit Log", icon: <ScrollText className="h-4 w-4" /> },
  { to: "/admin/users", label: "Users & Roles", icon: <UserCog className="h-4 w-4" /> },
];

export const Route = createFileRoute("/admin")({
  component: () => (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <RoleLayout menu={menu} />
    </ProtectedRoute>
  ),
});
