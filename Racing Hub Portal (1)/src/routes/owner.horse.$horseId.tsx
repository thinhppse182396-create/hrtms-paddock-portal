import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/common/Button";
import { getHorse, raceResults, violations, getRace, getJockey, races, awardCeremonies } from "@/data/databaseData";
import { FileText, Trophy, Flag, AlertTriangle, ChevronLeft, Download } from "lucide-react";

export const Route = createFileRoute("/owner/horse/$horseId")({ component: HorseDetailPage });

function HorseDetailPage() {
  const { horseId } = useParams({ from: "/owner/horse/$horseId" });
  const horse = getHorse(horseId);

  if (!horse) {
    return (
      <div>
        <Link to="/owner/my-horses" className="text-sm text-primary inline-flex items-center gap-1 mb-4"><ChevronLeft className="h-4 w-4" /> Back to My Horses</Link>
        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">Horse not found.</div>
      </div>
    );
  }

  const results = raceResults.filter(r => r.horseId === horse.id);
  const horseViolations = violations.filter(v => v.horseId === horse.id);
  const wins = results.filter(r => r.rank === 1).length;
  const top3 = results.filter(r => r.rank <= 3).length;
  const totalPrize = results.reduce((sum, r) => {
    const race = getRace(r.raceId);
    const prize = race?.prizes.find(p => p.rank === r.rank);
    return sum + (prize?.money ?? 0);
  }, 0);

  // Per-race performance rows with jockey + win/lose
  const perRaceRows = results.map(r => {
    const race = getRace(r.raceId);
    const jockey = getJockey(r.jockeyId);
    const prize = race?.prizes.find(p => p.rank === r.rank);
    return {
      raceId: r.raceId,
      raceLabel: race ? `${race.id} · ${race.track} · ${race.distance}m` : r.raceId,
      date: race?.date ?? "—",
      jockey: jockey?.name ?? r.jockeyId,
      rank: r.rank,
      finishTime: r.finishTime,
      outcome: r.disqualified ? "Disqualified" : r.rank === 1 ? "Win" : r.rank <= 3 ? "Podium" : "Lose",
      prize: prize?.money ?? 0,
      trophy: prize?.trophy ?? "—",
      ceremony: awardCeremonies.find(c => c.raceId === r.raceId)?.status ?? "—",
    };
  });

  // Future races horse is eligible-by-breed for (informational)
  const upcomingRaces = races.filter(r => r.status === "Scheduled");

  return (
    <div>
      <Link to="/owner/my-horses" className="text-sm text-primary inline-flex items-center gap-1 mb-4"><ChevronLeft className="h-4 w-4" /> Back to My Horses</Link>
      <PageHeader
        title={horse.name}
        subtitle={`${horse.breed} · Age ${horse.age} · ${horse.weight}kg · ${horse.color ?? "—"}`}
        actions={<StatusBadge status={horse.status} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Races" value={results.length} icon={<Flag className="h-5 w-5" />} />
        <StatCard label="Wins" value={wins} icon={<Trophy className="h-5 w-5" />} />
        <StatCard label="Top 3 Finishes" value={top3} icon={<Trophy className="h-5 w-5" />} />
        <StatCard label="Total Prize Won" value={`$${totalPrize.toLocaleString()}`} icon={<Trophy className="h-5 w-5" />} />
      </div>

      {/* Profile card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Profile & Pedigree</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="text-muted-foreground">Sire (father)</div><div className="text-foreground font-medium">{horse.sire ?? "—"}</div>
            <div className="text-muted-foreground">Dam (mother)</div><div className="text-foreground font-medium">{horse.dam ?? "—"}</div>
            <div className="text-muted-foreground">Color</div><div className="text-foreground font-medium">{horse.color ?? "—"}</div>
            <div className="text-muted-foreground">Microchip ID</div><div className="text-foreground font-medium">{horse.microchipId ?? "—"}</div>
            <div className="text-muted-foreground">Trainer</div><div className="text-foreground font-medium">{horse.trainer ?? "—"}</div>
            <div className="text-muted-foreground">Health cert expiry</div><div className="text-foreground font-medium">{horse.healthCertExpiry}</div>
          </div>
          {horse.bio && <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-3">{horse.bio}</p>}
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><FileText className="h-4 w-4" /> Documents & Papers</h3>
          <ul className="space-y-2 text-sm">
            {horse.documents.map(d => (
              <li key={d.number} className="border border-border rounded-md p-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-foreground">{d.type}</div>
                  <Button variant="ghost" className="px-2 py-1 text-xs"><Download className="h-3 w-3" /> PDF</Button>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  No. <span className="text-foreground">{d.number}</span> · Issued by {d.issuedBy}
                </div>
                <div className="text-xs text-muted-foreground">
                  {d.issuedDate}{d.expiryDate ? ` → expires ${d.expiryDate}` : ""}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Race-by-race performance */}
      <h3 className="text-sm font-semibold text-foreground mb-3">Race Performance — every race this horse entered</h3>
      <div className="mb-6">
        <DataTable
          columns={[
            { key: "raceLabel", header: "Race" },
            { key: "date", header: "Date" },
            { key: "jockey", header: "Jockey" },
            { key: "rank", header: "Rank", render: r => <span className="font-semibold">{r.rank}</span> },
            { key: "finishTime", header: "Time" },
            { key: "outcome", header: "Result", render: r => <StatusBadge status={r.outcome} /> },
            { key: "prize", header: "Prize Won", render: r => r.prize ? `$${r.prize.toLocaleString()}` : "—" },
            { key: "trophy", header: "Trophy" },
            { key: "ceremony", header: "Ceremony", render: r => <StatusBadge status={r.ceremony} /> },
          ]}
          rows={perRaceRows}
          empty="This horse has not raced yet."
        />
      </div>

      {/* Violations */}
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Violations on Record</h3>
      <div className="mb-6">
        <DataTable
          columns={[
            { key: "raceId", header: "Race" },
            { key: "type", header: "Type" },
            { key: "severity", header: "Severity" },
            { key: "description", header: "Description" },
          ]}
          rows={horseViolations}
          empty="No violations on record."
        />
      </div>

      {/* Upcoming races */}
      <h3 className="text-sm font-semibold text-foreground mb-3">Upcoming Races (breed-compatible)</h3>
      <DataTable
        columns={[
          { key: "id", header: "Race" },
          { key: "date", header: "Date" },
          { key: "track", header: "Track" },
          { key: "criteria", header: "Eligibility", render: r => `Age ${r.eligibility.minAge}-${r.eligibility.maxAge} · ${r.eligibility.minWeight}-${r.eligibility.maxWeight}kg` },
        ]}
        rows={upcomingRaces.filter(r => r.eligibility.allowedBreeds.includes(horse.breed))}
        empty="No upcoming races match this horse's breed."
      />
    </div>
  );
}
