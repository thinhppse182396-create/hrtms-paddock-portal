import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";

export const Route = createFileRoute("/spectator/leaderboard")({ component: SpectatorLeaderboard });

function SpectatorLeaderboard() {
  const jockeyBoard = jockeys.map(j => {
    const results = raceResults.filter(r => r.jockeyId === j.id);
    const wins = results.filter(r => r.rank === 1).length;
    const prize = results.reduce((s, r) => {
      const p = getRace(r.raceId)?.prizes.find(p => p.rank === r.rank);
      return s + (p?.money ?? 0);
    }, 0);
    return { id: j.id, name: j.name, ranking: j.ranking, races: results.length, wins, prize };
  }).sort((a, b) => a.ranking - b.ranking);

  const horseBoard = horses.map(h => {
    const results = raceResults.filter(r => r.horseId === h.id);
    const wins = results.filter(r => r.rank === 1).length;
    const prize = results.reduce((s, r) => {
      const p = getRace(r.raceId)?.prizes.find(p => p.rank === r.rank);
      return s + (p?.money ?? 0);
    }, 0);
    return { id: h.id, name: h.name, breed: h.breed, races: results.length, wins, prize };
  }).sort((a, b) => b.wins - a.wins || b.prize - a.prize);

  return (
    <div>
      <PageHeader title="Leaderboard" subtitle="Top jockeys and horses this season" />

      <h2 className="text-sm font-semibold text-foreground mb-3">Jockey Leaderboard</h2>
      <div className="mb-6">
        <DataTable
          columns={[
            { key: "ranking", header: "Rank", render: r => <span className="font-semibold">#{r.ranking}</span> },
            { key: "name", header: "Jockey" },
            { key: "races", header: "Races" },
            { key: "wins", header: "Wins" },
            { key: "prize", header: "Prize Money", render: r => `$${r.prize.toLocaleString()}` },
          ]}
          rows={jockeyBoard}
        />
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Horse Leaderboard</h2>
      <DataTable
        columns={[
          { key: "name", header: "Horse" },
          { key: "breed", header: "Breed" },
          { key: "races", header: "Races" },
          { key: "wins", header: "Wins" },
          { key: "prize", header: "Prize Money", render: r => `$${r.prize.toLocaleString()}` },
        ]}
        rows={horseBoard}
      />
    </div>
  );
}
