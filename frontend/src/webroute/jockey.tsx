import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { RoleLayout } from "@/components/common/RoleLayout";
import { LayoutDashboard, Inbox, Calendar, Flag, Trophy, User, Award } from "lucide-react";

const menu = [
  { to: "/jockey/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/jockey/invitations", label: "Invitations", icon: <Inbox className="h-4 w-4" /> },
  { to: "/jockey/schedule", label: "My Schedule", icon: <Calendar className="h-4 w-4" /> },
  { to: "/jockey/race-detail", label: "Race Detail", icon: <Flag className="h-4 w-4" /> },
  { to: "/jockey/performance", label: "Performance", icon: <Trophy className="h-4 w-4" /> },
  { to: "/jockey/awards", label: "Awards", icon: <Award className="h-4 w-4" /> },
  { to: "/jockey/profile", label: "Profile", icon: <User className="h-4 w-4" /> },
];

export const Route = createFileRoute("/jockey")({
  component: () => (
    <ProtectedRoute allowedRoles={["JOCKEY"]}>
      <RoleLayout menu={menu} />
    </ProtectedRoute>
  ),
});
