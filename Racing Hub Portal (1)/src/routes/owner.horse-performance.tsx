import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { horses, raceResults, violations } from "@/data/mockData";

export const Route = createFileRoute("/owner/horse-performance")({ component: HorsePerformance });

function HorsePerformance() {
  const myHorses = horses.filter(h => h.ownerId === "O001");

  return (
    <div>
      <PageHeader title="Horse Performance" subtitle="Race history and statistics" />
      <div className="space-y-6">
        {myHorses.map(h => {
          const results = raceResults.filter(r => r.horseId === h.id);
          const best = results.length ? Math.min(...results.map(r => r.rank)) : null;
          const v = violations.filter(x => x.horseId === h.id);
          return (
            <div key={h.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">{h.name}</div>
                  <div className="text-xs text-muted-foreground">{h.breed} · Age {h.age}</div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div><span className="text-muted-foreground">Races:</span> <span className="font-semibold">{results.length}</span></div>
                  <div><span className="text-muted-foreground">Best Rank:</span> <span className="font-semibold">{best ?? "—"}</span></div>
                  <div><span className="text-muted-foreground">Violations:</span> <span className="font-semibold">{v.length}</span></div>
                </div>
              </div>
              <DataTable
                columns={[
                  { key: "raceId", header: "Race" },
                  { key: "rank", header: "Rank" },
                  { key: "finishTime", header: "Time" },
                ]}
                rows={results}
                empty="No race history yet"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
