import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { RoleLayout } from "@/components/common/RoleLayout";
import { LayoutDashboard, Calendar, Trophy, BarChart3, Gift, Target } from "lucide-react";

const menu = [
  { to: "/spectator/predictions", label: "Predictions", icon: <Target className="h-4 w-4" /> },
  { to: "/spectator/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/spectator/schedule", label: "Race Schedule", icon: <Calendar className="h-4 w-4" /> },
  { to: "/spectator/results", label: "Results", icon: <Trophy className="h-4 w-4" /> },
  { to: "/spectator/leaderboard", label: "Leaderboard", icon: <BarChart3 className="h-4 w-4" /> },
  { to: "/spectator/awards", label: "Awards", icon: <Gift className="h-4 w-4" /> },
];

export const Route = createFileRoute("/spectator")({
  component: () => (
    <ProtectedRoute allowedRoles={["SPECTATOR"]}>
      <RoleLayout menu={menu} />
    </ProtectedRoute>
  ),
});
