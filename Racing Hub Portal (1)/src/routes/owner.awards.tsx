import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { horses, raceResults, getRace, getJockey, awardCeremonies } from "@/data/databaseData";
import { Trophy, DollarSign, Medal } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

export const Route = createFileRoute("/owner/awards")({ component: OwnerAwards });

function OwnerAwards() {
  const { currentUser } = useAuth();
  const myHorses = horses.filter(h => h.ownerId === currentUser?.accountId);
  const myHorseIds = new Set(myHorses.map(h => h.id));
  const myWinnings = raceResults
    .filter(r => myHorseIds.has(r.horseId))
    .map(r => {
      const race = getRace(r.raceId);
      const prize = race?.prizes.find(p => p.rank === r.rank);
      const ceremony = awardCeremonies.find(c => c.raceId === r.raceId);
      return {
        raceId: r.raceId,
        date: race?.date ?? "—",
        horse: myHorses.find(h => h.id === r.horseId)?.name ?? r.horseId,
        jockey: getJockey(r.jockeyId)?.name ?? r.jockeyId,
        rank: r.rank,
        money: prize?.money ?? 0,
        trophy: prize?.trophy ?? "—",
        ceremony: ceremony?.status ?? "—",
        venue: ceremony?.venue ?? "—",
      };
    });

  const totalMoney = myWinnings.reduce((s, w) => s + w.money, 0);
  const trophies = myWinnings.filter(w => w.rank === 1).length;
  const podiums = myWinnings.filter(w => w.rank <= 3).length;

  return (
    <div>
      <PageHeader title="Awards & Prize Money" subtitle="Total earnings, trophies and ceremony history for your stable" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Prize Money" value={`$${totalMoney.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard label="Trophies (1st place)" value={trophies} icon={<Trophy className="h-5 w-5" />} />
        <StatCard label="Podium Finishes" value={podiums} icon={<Medal className="h-5 w-5" />} />
      </div>
      <DataTable
        columns={[
          { key: "raceId", header: "Race" },
          { key: "date", header: "Date" },
          { key: "horse", header: "Horse" },
          { key: "jockey", header: "Jockey" },
          { key: "rank", header: "Rank", render: r => <span className="font-semibold">{r.rank}</span> },
          { key: "money", header: "Prize Money", render: r => r.money ? `$${r.money.toLocaleString()}` : "—" },
          { key: "trophy", header: "Trophy / Item" },
          { key: "venue", header: "Ceremony Venue" },
          { key: "ceremony", header: "Ceremony", render: r => <StatusBadge status={r.ceremony} /> },
        ]}
        rows={myWinnings}
        empty="No awards yet — your stable hasn't placed in a race."
      />
    </div>
  );
}
