import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth, getDashboardPathByRole } from "@/auth/AuthContext";

export const Route = createFileRoute("/")({
  component: RoleBasedRedirect,
});

function RoleBasedRedirect() {
  const { currentUser, isAuthenticated } = useAuth();
  if (!isAuthenticated || !currentUser) return <Navigate to="/login" />;
  return <Navigate to={getDashboardPathByRole(currentUser.role)} />;
}
