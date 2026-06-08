import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { races, jockeys, horses, raceResults, awardCeremonies, getRace, getHorse } from "@/data/databaseData";
import { Calendar, Flag, Trophy, Users } from "lucide-react";

export const Route = createFileRoute("/spectator/dashboard")({ component: SpectatorDashboard });

function SpectatorDashboard() {
  const upcoming = races.filter(r => r.status === "Scheduled");
  const ongoing = races.filter(r => r.status === "Ongoing");
  const upcomingCeremonies = awardCeremonies.filter(c => c.status === "Scheduled");

  return (
    <div>
      <PageHeader title="Spectator Dashboard" subtitle="Follow upcoming races, results and award ceremonies" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Upcoming Races" value={upcoming.length} icon={<Calendar className="h-5 w-5" />} />
        <StatCard label="Live Now" value={ongoing.length} icon={<Flag className="h-5 w-5" />} />
        <StatCard label="Active Jockeys" value={jockeys.filter(j => j.status === "Active").length} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Ceremonies" value={upcomingCeremonies.length} icon={<Trophy className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Upcoming Races</h2>
            <Link to="/spectator/schedule" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <DataTable
            columns={[
              { key: "id", header: "Race" },
              { key: "date", header: "Date", render: r => `${r.date} ${r.time}` },
              { key: "track", header: "Track" },
              { key: "prize", header: "Top Prize", render: r => `$${r.prizes[0]?.money.toLocaleString()}` },
            ]}
            rows={upcoming}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Latest Results</h2>
            <Link to="/spectator/results" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <DataTable
            columns={[
              { key: "raceId", header: "Race" },
              { key: "horse", header: "Horse", render: r => getHorse(r.horseId)?.name },
              { key: "rank", header: "Rank" },
              { key: "finishTime", header: "Time" },
              { key: "status", header: "Status", render: r => <StatusBadge status={r.published ? "Published" : "Pending"} /> },
            ]}
            rows={raceResults}
          />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Upcoming Award Ceremonies</h2>
        <DataTable
          columns={[
            { key: "raceId", header: "Race" },
            { key: "track", header: "Track", render: c => getRace(c.raceId)?.track },
            { key: "scheduledAt", header: "When" },
            { key: "venue", header: "Venue" },
            { key: "status", header: "Status", render: c => <StatusBadge status={c.status} /> },
          ]}
          rows={upcomingCeremonies}
        />
      </div>
    </div>
  );
}
