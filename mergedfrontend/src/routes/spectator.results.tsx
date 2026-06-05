import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { getPublishedRaces, type PublishedRace } from "@/lib/mockApi";
import { getTournament, getHorse, getJockey, violations } from "@/data/mockData";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/spectator/results")({ component: SpectatorPublishedResults });

function SpectatorPublishedResults() {
  const [races, setRaces] = useState<PublishedRace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PublishedRace | null>(null);

  useEffect(() => {
    getPublishedRaces().then(r => { setRaces(r); setLoading(false); });
  }, []);

  if (selected) return <RaceDetail race={selected} onBack={() => setSelected(null)} />;

  return (
    <div>
      <PageHeader title="Published Results" subtitle="Official race results available to the public" />
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-card border border-border rounded-lg animate-pulse" />)}
        </div>
      ) : races.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center text-muted-foreground text-sm">
          No published results yet.
        </div>
      ) : (
        <div className="space-y-3">
          {races.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-foreground flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  {r.id} — {r.track}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {getTournament(r.tournamentId)?.name} · {r.date} {r.time} · {r.distance}m
                </div>
                <div className="mt-1.5 flex gap-2 flex-wrap">
                  {r.results.slice(0, 3).map(res => (
                    <span key={res.horseId} className="text-xs bg-muted px-2 py-0.5 rounded-full text-foreground">
                      #{res.rank} {getHorse(res.horseId)?.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status="Published" />
                <Button variant="primary" onClick={() => setSelected(r)}>View Results</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RaceDetail({ race, onBack }: { race: PublishedRace; onBack: () => void }) {
  const raceViolations = violations.filter(v => v.raceId === race.id);
  const prizePool = race.prizes.reduce((s, p) => s + p.money, 0);

  return (
    <div>
      <PageHeader
        title={`${race.id} — ${race.track}`}
        subtitle={`${getTournament(race.tournamentId)?.name} · ${race.date} ${race.time} · ${race.distance}m`}
        actions={<Button variant="ghost" onClick={onBack}>← Back</Button>}
      />

      {/* #98 — Results table: Rank, Horse, Violation, PrizeMoney */}
      <div className="bg-card border border-border rounded-lg overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">Official Results</span>
          <StatusBadge status="Published" />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase text-muted-foreground border-b border-border">
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Horse</th>
              <th className="px-4 py-3 text-left">Jockey</th>
              <th className="px-4 py-3 text-left">Finish Time</th>
              <th className="px-4 py-3 text-left">Violation</th>
              <th className="px-4 py-3 text-right">Prize Money</th>
            </tr>
          </thead>
          <tbody>
            {race.results.map(r => {
              const horse = getHorse(r.horseId);
              const jockey = getJockey(r.jockeyId);
              const violation = raceViolations.find(v => v.horseId === r.horseId);
              const prize = race.prizes.find(p => p.rank === r.rank);
              return (
                <tr key={r.horseId} className={`border-b border-border ${r.disqualified ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {r.disqualified ? <span className="text-danger">DQ</span> : `#${r.rank}`}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{horse?.name ?? r.horseId}</td>
                  <td className="px-4 py-3 text-muted-foreground">{jockey?.name ?? r.jockeyId}</td>
                  <td className="px-4 py-3 font-mono">{r.finishTime}</td>
                  <td className="px-4 py-3">
                    {violation ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 text-warning px-2 py-0.5 text-xs">
                        {violation.type} ({violation.severity})
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">
                    {prize ? `$${prize.money.toLocaleString()}` : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted/30">
              <td colSpan={5} className="px-4 py-2 text-xs text-muted-foreground">Total Prize Pool</td>
              <td className="px-4 py-2 text-right font-bold text-foreground">${prizePool.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}