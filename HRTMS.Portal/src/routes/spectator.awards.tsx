import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { awardCeremonies, getRace, raceResults, getHorse, getJockey } from "@/data/databaseData";
import { Crown, Medal } from "lucide-react";

export const Route = createFileRoute("/spectator/awards")({ component: SpectatorAwards });

function SpectatorAwards() {
  const held = awardCeremonies.filter(c => c.status === "Held");

  return (
    <div>
      <PageHeader title="Award Ceremonies" subtitle="Past and upcoming award ceremonies" />

      <h2 className="text-sm font-semibold text-foreground mb-3">Recently Held — Podiums</h2>
      <div className="space-y-4 mb-6">
        {held.map(c => {
          const race = getRace(c.raceId);
          const podium = raceResults.filter(r => r.raceId === c.raceId).sort((a, b) => a.rank - b.rank).slice(0, 3);
          return (
            <div key={c.raceId} className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold text-foreground">{c.raceId} · {race?.track}</div>
                  <div className="text-xs text-muted-foreground">{c.scheduledAt} · {c.venue}</div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {podium.map(r => {
                  const horse = getHorse(r.horseId);
                  const jockey = getJockey(r.jockeyId);
                  const prize = race?.prizes.find(p => p.rank === r.rank);
                  return (
                    <div key={r.horseId} className="border border-border rounded-md p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1 text-warning">
                        {r.rank === 1 ? <Crown className="h-5 w-5" /> : <Medal className="h-4 w-4" />}
                        <span className="text-xs font-semibold uppercase">Rank {r.rank}</span>
                      </div>
                      <div className="font-semibold text-foreground">{horse?.name}</div>
                      <div className="text-xs text-muted-foreground">{jockey?.name}</div>
                      <div className="text-sm font-semibold text-foreground mt-2">${prize?.money.toLocaleString()}</div>
                      <div className="text-[11px] text-muted-foreground">{prize?.trophy}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">All Ceremonies</h2>
      <DataTable
        columns={[
          { key: "raceId", header: "Race" },
          { key: "track", header: "Track", render: c => getRace(c.raceId)?.track },
          { key: "scheduledAt", header: "When" },
          { key: "venue", header: "Venue" },
          { key: "status", header: "Status", render: c => <StatusBadge status={c.status} /> },
        ]}
        rows={awardCeremonies}
      />
    </div>
  );
}
