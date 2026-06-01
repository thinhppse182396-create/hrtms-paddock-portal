import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Trophy, LogIn, Calendar, Award, BarChart3, Flag, Sparkles, Users, Rabbit, Target } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { races, raceResults, jockeys, horses, awardCeremonies, getRace, getHorse, getJockey, getTournament } from "@/data/mockData";

export const Route = createFileRoute("/watch")({ component: PublicWatchPage });

type Tab = "schedule" | "results" | "leaderboard" | "awards";

function PublicWatchPage() {
  const [tab, setTab] = useState<Tab>("schedule");

  const tabs: { key: Tab; label: string; icon: ReactNode }[] = [
    { key: "schedule", label: "Schedule", icon: <Calendar className="h-4 w-4" /> },
    { key: "results", label: "Results", icon: <Flag className="h-4 w-4" /> },
    { key: "leaderboard", label: "Leaderboard", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "awards", label: "Awards", icon: <Award className="h-4 w-4" /> },
  ];

  const upcomingCount = races.filter(r => r.status === "Scheduled").length;
  const completedCount = races.filter(r => r.status === "Completed").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Public header */}
      <header className="bg-card/80 backdrop-blur border-b border-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-blue-600 text-primary-foreground flex items-center justify-center shadow-sm"><Trophy className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-bold text-foreground leading-tight">Racing Portal</div>
              <div className="text-[11px] text-muted-foreground">Public spectator view</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm px-3.5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors shadow-sm">
              <LogIn className="h-4 w-4" /> Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#1e3a8a] text-white">
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute -top-24 right-10 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 py-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 ring-1 ring-white/15 text-xs mb-4">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span className="text-white/80">Live · Spring Cup 2026 in progress</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight max-w-3xl">
            Watch every race, follow every champion —
            <span className="text-amber-300"> no sign-in required.</span>
          </h1>
          <p className="text-white/70 mt-3 max-w-xl">
            Browse the schedule, results, leaderboards and award ceremonies of every tournament in one place.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 max-w-3xl">
            {[
              { icon: Calendar, value: upcomingCount, label: "Upcoming races" },
              { icon: Flag, value: completedCount, label: "Races completed" },
              { icon: Rabbit, value: horses.length, label: "Horses racing" },
              { icon: Users, value: jockeys.length, label: "Active jockeys" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-xl bg-white/[0.06] ring-1 ring-white/10 backdrop-blur p-4">
                <Icon className="h-4 w-4 text-amber-300 mb-2" />
                <div className="text-2xl font-bold tabular-nums">{value}</div>
                <div className="text-[11px] text-white/60 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/login" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-300 text-slate-900 font-medium text-sm hover:bg-amber-200 transition-colors shadow">
              <Target className="h-4 w-4" /> Sign in to place predictions
            </Link>
            <a href="#explore" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 ring-1 ring-white/20 text-white text-sm hover:bg-white/15 transition-colors">
              Browse races
            </a>
          </div>
        </div>
      </section>

      <div id="explore" className="max-w-6xl mx-auto px-6 py-8">
        <PageHeader title="Live Racing Hub" subtitle="Browse schedule, results, leaderboards and award ceremonies — no sign-in required" />

        <div className="border-b border-border mb-6 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
                tab === t.key ? "border-primary text-primary font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>


        {tab === "schedule" && (
          <DataTable
            columns={[
              { key: "id", header: "Race" },
              { key: "tournament", header: "Tournament", render: r => getTournament(r.tournamentId)?.name },
              { key: "date", header: "Date", render: r => `${r.date} ${r.time}` },
              { key: "track", header: "Track" },
              { key: "distance", header: "Distance", render: r => `${r.distance}m` },
              { key: "prize", header: "Top Prize", render: r => `$${r.prizes[0]?.money.toLocaleString()}` },
              { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
            ]}
            rows={races.filter(r => r.status !== "Completed")}
          />
        )}

        {tab === "results" && (
          <div className="space-y-4">
            {Array.from(new Set(raceResults.map(r => r.raceId))).map(raceId => {
              const race = getRace(raceId);
              const rows = raceResults.filter(r => r.raceId === raceId).sort((a, b) => a.rank - b.rank);
              return (
                <div key={raceId} className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="px-5 py-3 border-b border-border">
                    <div className="font-semibold text-foreground">{raceId} — {race?.track}</div>
                    <div className="text-xs text-muted-foreground">{race?.date} {race?.time}</div>
                  </div>
                  <DataTable
                    columns={[
                      { key: "rank", header: "Rank" },
                      { key: "horse", header: "Horse", render: r => getHorse(r.horseId)?.name },
                      { key: "jockey", header: "Jockey", render: r => getJockey(r.jockeyId)?.name },
                      { key: "finishTime", header: "Time" },
                    ]}
                    rows={rows}
                  />
                </div>
              );
            })}
          </div>
        )}

        {tab === "leaderboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Top Jockeys</h3>
              <DataTable
                columns={[
                  { key: "ranking", header: "Rank", render: r => `#${r.ranking}` },
                  { key: "name", header: "Jockey" },
                  { key: "weight", header: "Weight" },
                ]}
                rows={[...jockeys].sort((a, b) => a.ranking - b.ranking)}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Horses</h3>
              <DataTable
                columns={[
                  { key: "name", header: "Horse" },
                  { key: "breed", header: "Breed" },
                  { key: "age", header: "Age" },
                ]}
                rows={horses}
              />
            </div>
          </div>
        )}

        {tab === "awards" && (
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
        )}
      </div>
    </div>
  );
}
