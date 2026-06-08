import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { raceResults, getRace, getHorse, getJockey } from "@/data/databaseData";

export const Route = createFileRoute("/spectator/results")({ component: SpectatorResults });

function SpectatorResults() {
  const byRace = Array.from(new Set(raceResults.map(r => r.raceId))).map(raceId => ({
    raceId,
    race: getRace(raceId),
    rows: raceResults.filter(r => r.raceId === raceId).sort((a, b) => a.rank - b.rank),
  }));

  return (
    <div>
      <PageHeader title="Race Results" subtitle="Confirmed race results" />
      <div className="space-y-6">
        {byRace.map(g => (
          <div key={g.raceId} className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <div className="font-semibold text-foreground">{g.raceId} — {g.race?.track} · {g.race?.distance}m</div>
              <div className="text-xs text-muted-foreground">{g.race?.date} {g.race?.time}</div>
            </div>
            <DataTable
              columns={[
                { key: "rank", header: "Rank" },
                { key: "horse", header: "Horse", render: r => getHorse(r.horseId)?.name },
                { key: "jockey", header: "Jockey", render: r => getJockey(r.jockeyId)?.name },
                { key: "finishTime", header: "Time" },
                { key: "status", header: "Status", render: r => <StatusBadge status={r.published ? "Published" : "Pending"} /> },
              ]}
              rows={g.rows}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
