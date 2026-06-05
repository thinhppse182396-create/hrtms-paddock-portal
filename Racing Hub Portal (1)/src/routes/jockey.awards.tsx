import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { jockeys, raceResults, getRace, getHorse, awardCeremonies } from "@/data/databaseData";
import { useAuth } from "@/auth/AuthContext";
import { Trophy, DollarSign, Medal } from "lucide-react";

export const Route = createFileRoute("/jockey/awards")({ component: JockeyAwards });

function JockeyAwards() {
  const { currentUser } = useAuth();
  const myJockeyId = jockeys.find(jockey => jockey.accountId === currentUser?.accountId)?.id ?? "";
  const myWinnings = raceResults
    .filter(r => r.jockeyId === myJockeyId)
    .map(r => {
      const race = getRace(r.raceId);
      const prize = race?.prizes.find(p => p.rank === r.rank);
      const ceremony = awardCeremonies.find(c => c.raceId === r.raceId);
      return {
        raceId: r.raceId,
        date: race?.date ?? "—",
        horse: getHorse(r.horseId)?.name ?? r.horseId,
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
      <PageHeader title="My Awards" subtitle="Career prize money, trophies and ceremony history" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Prize Money" value={`$${totalMoney.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard label="Trophies" value={trophies} icon={<Trophy className="h-5 w-5" />} />
        <StatCard label="Podium Finishes" value={podiums} icon={<Medal className="h-5 w-5" />} />
      </div>
      <DataTable
        columns={[
          { key: "raceId", header: "Race" },
          { key: "date", header: "Date" },
          { key: "horse", header: "Horse" },
          { key: "rank", header: "Rank", render: r => <span className="font-semibold">{r.rank}</span> },
          { key: "money", header: "Prize", render: r => r.money ? `$${r.money.toLocaleString()}` : "—" },
          { key: "trophy", header: "Trophy" },
          { key: "venue", header: "Venue" },
          { key: "ceremony", header: "Ceremony", render: r => <StatusBadge status={r.ceremony} /> },
        ]}
        rows={myWinnings}
        empty="No awards yet."
      />
    </div>
  );
}
