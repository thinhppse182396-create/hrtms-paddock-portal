import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Inbox, Trophy, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { jockeyInvitations, races, raceResults, getHorse, getRace } from "@/data/mockData";

export const Route = createFileRoute("/jockey/dashboard")({ component: JockeyDashboard });

function JockeyDashboard() {
  const myJockeyId = "J001";
  const myInvites = jockeyInvitations.filter(i => i.jockeyId === myJockeyId);
  const accepted = myInvites.filter(i => i.status === "Accepted");
  const waiting = myInvites.filter(i => i.status === "Waiting");
  const myRaces = races.filter(r => accepted.some(a => a.raceId === r.id));
  const myResults = raceResults.filter(r => r.jockeyId === myJockeyId);

  return (
    <div>
      <PageHeader title="Jockey Dashboard" subtitle="Your upcoming races and performance" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Upcoming Races" value={myRaces.filter(r => r.status === "Scheduled").length} icon={<Calendar className="h-5 w-5" />} />
        <StatCard label="Pending Invitations" value={waiting.length} icon={<Inbox className="h-5 w-5" />} />
        <StatCard label="Races Completed" value={myResults.length} icon={<Trophy className="h-5 w-5" />} />
        <StatCard label="Current Ranking" value="#3" hint="Season standings" icon={<Trophy className="h-5 w-5" />} />
      </div>

      {waiting.length > 1 && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-foreground">Schedule warning</div>
            <div className="text-muted-foreground">You have multiple invitations that may overlap. Please review before accepting.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Upcoming Races</h2>
          <DataTable
            columns={[
              { key: "id", header: "Race" },
              { key: "date", header: "Date" },
              { key: "track", header: "Track" },
              { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
            ]}
            rows={myRaces}
          />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Recent Results</h2>
          <DataTable
            columns={[
              { key: "race", header: "Race", render: r => getRace(r.raceId)?.id },
              { key: "horse", header: "Horse", render: r => getHorse(r.horseId)?.name },
              { key: "rank", header: "Rank" },
              { key: "finishTime", header: "Time" },
            ]}
            rows={myResults}
          />
        </div>
      </div>
    </div>
  );
}
