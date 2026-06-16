import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";

export const Route = createFileRoute("/spectator/schedule")({ component: SpectatorSchedule });

function SpectatorSchedule() {
  return (
    <div>
      <PageHeader title="Race Schedule" subtitle="All upcoming and ongoing races" />
      <DataTable
        columns={[
          { key: "id", header: "Race" },
          { key: "tournament", header: "Tournament", render: r => getTournament(r.tournamentId)?.name },
          { key: "date", header: "Date", render: r => `${r.date} ${r.time}` },
          { key: "track", header: "Track" },
          { key: "distance", header: "Distance", render: r => `${r.distance}m` },
          { key: "lanes", header: "Lanes" },
          { key: "prize", header: "Top Prize", render: r => `$${r.prizes[0]?.money.toLocaleString()}` },
          { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
        ]}
        rows={races.filter(r => r.status !== "Completed")}
      />
    </div>
  );
}
