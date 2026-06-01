import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatCard } from "@/components/common/StatCard";
import { raceResults, violations, getHorse, getRace } from "@/data/mockData";
import { Trophy, Medal, Timer } from "lucide-react";

export const Route = createFileRoute("/jockey/performance")({ component: PerformanceHistory });

function PerformanceHistory() {
  const myJockeyId = "J001";
  const results = raceResults.filter(r => r.jockeyId === myJockeyId);
  const wins = results.filter(r => r.rank === 1).length;
  const top3 = results.filter(r => r.rank <= 3).length;
  const myViolations = violations.filter(v => v.jockeyId === myJockeyId);

  return (
    <div>
      <PageHeader title="Performance History" subtitle="Your race results and statistics" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Races" value={results.length} icon={<Timer className="h-5 w-5" />} />
        <StatCard label="Wins" value={wins} icon={<Trophy className="h-5 w-5" />} />
        <StatCard label="Top 3 Finishes" value={top3} icon={<Medal className="h-5 w-5" />} />
        <StatCard label="Violations" value={myViolations.length} icon={<Medal className="h-5 w-5" />} />
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Race Results</h2>
      <div className="mb-6">
        <DataTable
          columns={[
            { key: "race", header: "Race", render: r => getRace(r.raceId)?.id },
            { key: "horse", header: "Horse", render: r => getHorse(r.horseId)?.name },
            { key: "rank", header: "Rank" },
            { key: "finishTime", header: "Time" },
          ]}
          rows={results}
        />
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Violations</h2>
      <DataTable
        columns={[
          { key: "raceId", header: "Race" },
          { key: "type", header: "Type" },
          { key: "severity", header: "Severity" },
          { key: "description", header: "Description" },
        ]}
        rows={myViolations}
        empty="No violations on record"
      />
    </div>
  );
}
