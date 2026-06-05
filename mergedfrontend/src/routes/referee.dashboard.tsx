import { createFileRoute } from "@tanstack/react-router";
import { Flag, Timer, AlertTriangle, FileText } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";

export const Route = createFileRoute("/referee/dashboard")({ component: RefereeDashboard });

function RefereeDashboard() {
  const myRefId = "RF001";
  const myRaceIds = refereeAssignments.filter(a => a.refereeId === myRefId).map(a => a.raceId);
  const assignedRaces = races.filter(r => myRaceIds.includes(r.id));
  const myReports = refereeReports.filter(r => r.refereeId === myRefId);
  const today = "2026-04-10";

  return (
    <div>
      <PageHeader title="Referee Dashboard" subtitle="Your assigned races and pending tasks" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Assigned Races" value={assignedRaces.length} icon={<Flag className="h-5 w-5" />} />
        <StatCard label="Races Today" value={assignedRaces.filter(r => r.date === today).length} icon={<Timer className="h-5 w-5" />} />
        <StatCard label="Violations Logged" value={violations.length} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="Pending Reports" value={myReports.filter(r => r.status !== "Confirmed").length} icon={<FileText className="h-5 w-5" />} />
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">My Races</h2>
      <DataTable
        columns={[
          { key: "id", header: "Race" },
          { key: "date", header: "Date" },
          { key: "track", header: "Track" },
          { key: "distance", header: "Distance", render: r => `${r.distance}m` },
          { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
        ]}
        rows={assignedRaces}
      />
    </div>
  );
}
