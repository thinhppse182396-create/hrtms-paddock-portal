import { createFileRoute, Navigate } from "@tanstack/react-router";

// Betting was merged into Predictions. This route redirects for backward compatibility.
export const Route = createFileRoute("/spectator/betting")({
  component: () => <Navigate to="/spectator/predictions" replace />,
});
