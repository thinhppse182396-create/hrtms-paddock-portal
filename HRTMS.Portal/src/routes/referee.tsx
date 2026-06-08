import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { RoleLayout } from "@/components/common/RoleLayout";
import { LayoutDashboard, Flag, ClipboardCheck, AlertTriangle, Timer, FileText } from "lucide-react";

const menu = [
  { to: "/referee/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/referee/assigned-races", label: "Assigned Races", icon: <Flag className="h-4 w-4" /> },
  { to: "/referee/pre-race-check", label: "Pre-Race Check", icon: <ClipboardCheck className="h-4 w-4" /> },
  { to: "/referee/violations", label: "Violations", icon: <AlertTriangle className="h-4 w-4" /> },
  { to: "/referee/record-result", label: "Record Result", icon: <Timer className="h-4 w-4" /> },
  { to: "/referee/reports", label: "Reports", icon: <FileText className="h-4 w-4" /> },
];

export const Route = createFileRoute("/referee")({
  component: () => (
    <ProtectedRoute allowedRoles={["REFEREE"]}>
      <RoleLayout menu={menu} />
    </ProtectedRoute>
  ),
});
