import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy, Flag, Rabbit, Users, Clock, AlertCircle, Radio } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { StatCardSkeleton } from "@/components/common/StatCardSkeleton";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { tournaments, races, horses, jockeys, registrations, refereeReports, raceResults, getRace, getHorse } from "@/data/databaseData";

export const Route = createFileRoute("/admin/dashboard")({ component: AdminDashboard });

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);

  const scheduled = races.filter(r => r.status === "Scheduled").length;
  const ongoing = races.filter(r => r.status === "Ongoing").length;
  const completed = races.filter(r => r.status === "Completed").length;
  const pendingReports = refereeReports.filter(r => r.status !== "Confirmed").length;
  const pendingResults = raceResults.filter(r => !r.published).length;

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Overview of tournaments, races and operations" />

      <LiveTicker />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
        ) : (
          <>
            <StatCard label="Tournaments" value={tournaments.length} icon={<Trophy className="h-5 w-5" />} />
            <StatCard label="Races" value={races.length} icon={<Flag className="h-5 w-5" />} />
            <StatCard label="Registered Horses" value={horses.length} icon={<Rabbit className="h-5 w-5" />} />
            <StatCard label="Jockeys" value={jockeys.length} icon={<Users className="h-5 w-5" />} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {loading ? (
          <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
        ) : (
          <>
            <StatCard label="Scheduled" value={scheduled} hint="Upcoming races" icon={<Clock className="h-5 w-5" />} />
            <StatCard label="Ongoing" value={ongoing} hint="Currently running" icon={<Flag className="h-5 w-5" />} />
            <StatCard label="Completed" value={completed} hint="Finished races" icon={<Trophy className="h-5 w-5" />} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Race Status Overview</h2>
          <DataTable
            columns={[
              { key: "id", header: "Race" },
              { key: "track", header: "Track" },
              { key: "date", header: "Date" },
              { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
            ]}
            rows={races}
            loading={loading}
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-warning" /> Action Required
          </h2>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Registrations pending approval</span>
              <span className="font-bold text-warning">{registrations.filter(r => r.status === "Pending").length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Referee reports pending</span>
              <span className="font-bold text-warning">{pendingReports}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Results awaiting publish</span>
              <span className="font-bold text-warning">{pendingResults}</span>
            </div>
          </div>

          <h2 className="text-sm font-semibold text-foreground mb-3 mt-6">Latest Results</h2>
          <DataTable
            columns={[
              { key: "raceId", header: "Race" },
              { key: "horse", header: "Horse", render: r => getHorse(r.horseId)?.name ?? r.horseId },
              { key: "rank", header: "Rank" },
              { key: "finishTime", header: "Time" },
            ]}
            rows={raceResults.slice(0, 5).map(r => ({ ...r, race: getRace(r.raceId)?.id }))}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

function LiveTicker() {
  const ongoing = races.filter(r => r.status === "Ongoing");
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 2000); return () => clearInterval(id); }, []);
  if (ongoing.length === 0) return null;
  const events = [
    "passing 600m marker",
    "taking the lead at turn 3",
    "challenging from the outside",
    "holding pace mid-pack",
    "pulling away on the straight",
  ];
  return (
    <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 flex items-center gap-3">
      <Radio className="h-4 w-4 text-primary animate-pulse" />
      <div className="text-xs font-semibold text-primary uppercase">Live</div>
      <div className="text-sm text-foreground flex-1 truncate">
        {ongoing[0].id} @ {ongoing[0].track} — {events[tick % events.length]}
      </div>
      <span className="text-xs text-muted-foreground">auto-refresh 2s</span>
    </div>
  );
}
