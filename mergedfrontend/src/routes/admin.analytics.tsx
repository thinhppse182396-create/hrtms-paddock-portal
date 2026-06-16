import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/PageHeader";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

export const Route = createFileRoute("/admin/analytics")({ component: AnalyticsDashboard, ssr: false });

const COLORS = ["oklch(0.546 0.215 262.881)", "oklch(0.769 0.188 70.08)", "oklch(0.696 0.17 162.48)", "oklch(0.628 0.234 27.325)", "oklch(0.554 0.046 257.417)"];
const C = { primary: COLORS[0], warning: COLORS[1], success: COLORS[2], danger: COLORS[3], muted: COLORS[4] };

function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);

  const statusData = ["Scheduled", "Ongoing", "Completed", "Cancelled"].map(s => ({
    name: s, value: races.filter(r => r.status === s).length,
  }));

  const regByTournament = tournaments.map(t => ({
    name: t.name.split(" ")[0],
    registrations: registrations.filter(rg => {
      const r = races.find(x => x.id === rg.raceId);
      return r?.tournamentId === t.id;
    }).length,
  }));

  const wins = horses.map(h => ({
    name: h.name,
    wins: raceResults.filter(r => r.horseId === h.id && r.rank === 1 && !r.disqualified).length,
    podium: raceResults.filter(r => r.horseId === h.id && r.rank <= 3 && !r.disqualified).length,
  })).sort((a, b) => b.podium - a.podium).slice(0, 6);

  const prizeTrend = races.slice(0, 6).map((r, i) => ({
    name: r.id,
    prize: r.prizes.reduce((s, p) => s + p.money, 0),
    round: i + 1,
  }));

  const jockeyPerf = jockeys.map(j => ({
    name: j.name.split(" ")[0],
    races: raceResults.filter(r => r.jockeyId === j.id).length,
    wins: raceResults.filter(r => r.jockeyId === j.id && r.rank === 1).length,
  }));

  return (
    <div>
      <PageHeader title="Historical Analytics" subtitle="Performance trends across horses, jockeys and tournaments" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <>
            <ChartCardSkeleton />
            <ChartCardSkeleton />
            <ChartCardSkeleton />
            <ChartCardSkeleton />
            <ChartCardSkeleton />
            <ChartCardSkeleton />
          </>
        ) : (
          <>
            <ChartCard title="Race Status Distribution">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Registrations per Tournament">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={regByTournament}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip />
                  <Bar dataKey="registrations" fill={C.primary} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Top Horses — Wins vs Podium">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={wins}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
                  <Bar dataKey="wins" fill={C.success} />
                  <Bar dataKey="podium" fill={C.warning} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Prize Pool Trend (per race)">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={prizeTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" /><YAxis /><Tooltip />
                  <Line type="monotone" dataKey="prize" stroke={C.primary} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Jockey Performance">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={jockeyPerf}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
                  <Bar dataKey="races" fill={C.muted} />
                  <Bar dataKey="wins" fill={C.success} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Recent Result Times (s)">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={raceResults.map(r => ({
                  name: `${getHorse(r.horseId)?.name?.split(" ")[0]}/${getJockey(r.jockeyId)?.name?.split(" ")[0]}`,
                  seconds: Number(r.finishTime.replace(":", ".").replace(/[^0-9.]/g, "")) || 0,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" /><YAxis /><Tooltip />
                  <Line type="monotone" dataKey="seconds" stroke={C.warning} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </>
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ChartCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <Skeleton className="h-4 w-32 mb-3" />
      <Skeleton className="h-[260px] w-full rounded-md" />
    </div>
  );
}
