import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { StatCard } from "@/components/common/StatCard";
import { Target, Trophy, Coins, Sparkles, Radio } from "lucide-react";
import { usePersistentCollection } from "@/hooks/usePersistentCollection";
import { getCommitment, guaranteedMinimum, actualPrizePool, prizeBreakdown } from "@/lib/racing";
import { loadRaceControl } from "@/lib/raceControlStore";
import { useAuth } from "@/auth/AuthContext";

export const Route = createFileRoute("/spectator/predictions")({ component: PredictionsPage });

interface Prediction {
  id: string;
  raceId: string;
  horseId: string;
  predictedRank: number;
  status: "Pending" | "Won" | "Lost";
  payout: number;     // money won (USD) — 100% / 30% / 0% of race top prize
  createdAt: string;
}

const initialBoard = [
  { user: "Mia Tran", payout: 32000 },
  { user: "Chen Wu", payout: 41000 },
  { user: "Jordan Lee", payout: 18000 },
];

type ResultRow = (typeof resultSeed)[number];

// Settle one prediction against recorded race results.
function settle(p: Prediction, results: ResultRow[]): Prediction {
  if (p.status !== "Pending") return p;
  const race = getRace(p.raceId);
  if (!race) return p;
  const raceResults = results.filter(r => r.raceId === p.raceId);
  if (raceResults.length === 0) return p; // race not finished yet
  const top = race.prizes[0]?.money ?? 0;
  const result = raceResults.find(r => r.horseId === p.horseId);
  if (!result || result.disqualified) return { ...p, status: "Lost", payout: 0 };
  if (result.rank === p.predictedRank) return { ...p, status: "Won", payout: Math.round(top * 1.0) };
  if (result.rank <= 3) return { ...p, status: "Won", payout: Math.round(top * 0.3) };
  return { ...p, status: "Lost", payout: 0 };
}

function PredictionsPage() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;

  const [results] = usePersistentCollection<ResultRow>("admin:results", resultSeed);

  const storageKey = `predictions:${currentUser.username}`;
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [form, setForm] = useState({ raceId: "", horseId: "", predictedRank: 1 });
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const saved = raw ? (JSON.parse(raw) as Prediction[]) : [];
      setPredictions(saved.map(p => settle(p, results)));
    } catch { /* ignore */ }
    setHydrated(true);
  }, [storageKey]);

  // Re-settle pending predictions when results change.
  useEffect(() => {
    if (!hydrated) return;
    setPredictions(prev => prev.map(p => settle(p, results)));
  }, [results, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(predictions)); } catch { /* ignore */ }
  }, [predictions, hydrated, storageKey]);


  const myPayout = predictions.reduce((s, p) => s + p.payout, 0);
  const wins = predictions.filter(p => p.status === "Won").length;

  const selectedRace = form.raceId ? getRace(form.raceId) : null;
  const topPrize = selectedRace?.prizes[0]?.money ?? 0;
  const exactPayout = Math.round(topPrize * 1.0);
  const podiumPayout = Math.round(topPrize * 0.3);

  const fieldHorses = useMemo(() => {
    if (!form.raceId) return [];
    return registrations
      .filter(r => r.raceId === form.raceId && r.status === "Approved")
      .map(r => ({ ...r, horse: getHorse(r.horseId), jockey: getJockey(r.jockeyId) }))
      .filter(x => x.horse);
  }, [form.raceId]);

  const submit = () => {
    setErr(null);
    if (!form.raceId || !form.horseId) return setErr("Select a race and a horse");
    if (form.predictedRank < 1 || form.predictedRank > 10) return setErr("Rank must be 1–10");
    const race = getRace(form.raceId);
    if (!race) return setErr("Race not found");
    if (race.status === "Cancelled") return setErr("Race was cancelled");
    const dup = predictions.find(p => p.raceId === form.raceId && p.horseId === form.horseId && p.status === "Pending");
    if (dup) return setErr("You already have a pending prediction for this horse");

    const draft: Prediction = {
      id: `P${(predictions.length + 1).toString().padStart(3, "0")}`,
      raceId: form.raceId,
      horseId: form.horseId,
      predictedRank: Number(form.predictedRank),
      status: "Pending",
      payout: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const settled = settle(draft, results);
    setPredictions(p => [settled, ...p]);
    setToast(`Prediction saved · ${getHorse(form.horseId)?.name} → rank ${form.predictedRank}`);
    setTimeout(() => setToast(null), 2500);
    setForm({ raceId: "", horseId: "", predictedRank: 1 });
  };

  // Combined leaderboard (mock + me) ordered by payout (USD)
  const leaderboard = [...initialBoard, { user: currentUser.name, payout: myPayout }]
    .sort((a, b) => b.payout - a.payout);

  // Only races a user can predict: not cancelled
  const predictableRaces = races.filter(r => r.status !== "Cancelled");

  // Official results + prize distribution for the selected race
  const control = form.raceId ? loadRaceControl(form.raceId) : null;
  const officialResults = useMemo(() => {
    if (!form.raceId) return [];
    return results
      .filter(r => r.raceId === form.raceId)
      .sort((a, b) => a.rank - b.rank);
  }, [results, form.raceId]);
  const isOfficial = control?.phase === "Official" || (selectedRace?.status === "Completed");
  const approvedCount = registrations.filter(r => r.raceId === form.raceId && r.status === "Approved").length;
  const commitment = form.raceId ? getCommitment(form.raceId) : null;
  const officialPool = commitment ? actualPrizePool(commitment, approvedCount || 1, (selectedRace?.prizes[0]?.money ?? 0) * 6) : 0;
  const officialGuaranteed = commitment ? guaranteedMinimum(commitment, approvedCount || 1) : 0;
  const distribution = officialPool ? prizeBreakdown(officialPool, approvedCount || 1) : [];

  return (
    <div>
      <PageHeader
        title="Predictions"
        subtitle="Predict the rank, win a share of the prize money — exact rank wins 100% of the top prize"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Winnings" value={`$${myPayout.toLocaleString()}`} icon={<Coins className="h-5 w-5" />} hint="Sum of payouts" />
        <StatCard label="Correct Predictions" value={wins} icon={<Trophy className="h-5 w-5" />} hint={`${predictions.length} total`} />
        <StatCard label="Leaderboard Rank" value={`#${leaderboard.findIndex(l => l.user === currentUser.name) + 1}`} icon={<Target className="h-5 w-5" />} />
      </div>

      {toast && (
        <div className="mb-4 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />{toast}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Prediction slip */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5 h-fit">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Make a Prediction
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-muted-foreground">Race</label>
              <select
                className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background"
                value={form.raceId}
                onChange={e => setForm(f => ({ ...f, raceId: e.target.value, horseId: "" }))}
              >
                <option value="">— Select race —</option>
                {predictableRaces.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.id} · {r.track} · {r.date} · {r.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Horse</label>
              <select
                className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background"
                value={form.horseId}
                onChange={e => setForm(f => ({ ...f, horseId: e.target.value }))}
                disabled={!form.raceId}
              >
                <option value="">— Select horse —</option>
                {fieldHorses.map(f => (
                  <option key={f.horseId} value={f.horseId}>
                    {f.horse!.name} · {f.jockey?.name ?? "—"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Predicted Rank</label>
              <div className="mt-1 grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, predictedRank: n }))}
                    className={`py-2 rounded-md border text-xs font-semibold ${form.predictedRank === n ? "bg-primary text-primary-foreground border-primary" : "bg-card border-input hover:bg-accent"}`}
                  >
                    #{n}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-md bg-muted/50 border border-border p-3 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Top prize (this race)</span><span className="font-semibold text-foreground">${topPrize.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Exact rank (100%)</span><span className="font-bold text-success">+${exactPayout.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Podium top 3 (30%)</span><span className="font-medium text-foreground">+${podiumPayout.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Outside top 3</span><span className="text-muted-foreground">$0</span></div>
            </div>

            {err && <div className="text-xs text-destructive">{err}</div>}

            <Button className="w-full" onClick={submit} disabled={!form.raceId || !form.horseId}>
              Submit Prediction
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Free to play. No stake. Winnings are virtual prize-money points.
            </p>
          </div>
        </div>

        {/* Field */}
        <div className="lg:col-span-3">
          <h3 className="text-sm font-semibold text-foreground mb-3">Field</h3>
          {form.raceId ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fieldHorses.map(f => (
                <button
                  key={f.horseId}
                  onClick={() => setForm(s => ({ ...s, horseId: f.horseId }))}
                  className={`text-left rounded-lg border p-4 transition-all hover:shadow-md ${form.horseId === f.horseId ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                >
                  <div className="font-semibold text-foreground">{f.horse!.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{f.jockey?.name ?? "—"} · {f.horse!.breed} · age {f.horse!.age}</div>
                </button>
              ))}
              {fieldHorses.length === 0 && (
                <div className="text-sm text-muted-foreground py-8 text-center col-span-2">No approved horses for this race yet.</div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Pick a race to see the field.
            </div>
          )}

          <h3 className="text-sm font-semibold text-foreground mt-6 mb-3">Leaderboard</h3>
          <DataTable
            columns={[
              { key: "rank", header: "#", render: (r) => `#${leaderboard.indexOf(r) + 1}` },
              { key: "user", header: "Spectator" },
              { key: "payout", header: "Winnings", render: r => `$${r.payout.toLocaleString()}` },
            ]}
            rows={leaderboard}
          />
        </div>
      </div>

      {/* Official results & prize distribution for the selected race */}
      {form.raceId && (
        <div className="mt-8">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning" /> Official Results — {form.raceId}
              {isOfficial ? <StatusBadge status="Official" /> : <StatusBadge status="Pending" />}
            </h3>
            <Link to="/spectator/race/$raceId" params={{ raceId: form.raceId }}>
              <Button variant="secondary"><Radio className="h-4 w-4" /> Watch live race view</Button>
            </Link>
          </div>

          {officialResults.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Final order</h4>
                <table className="w-full text-sm">
                  <thead><tr className="text-xs uppercase text-muted-foreground"><th className="text-left py-1.5">Rank</th><th className="text-left">Horse</th><th className="text-left">Jockey</th><th className="text-right">Finish</th></tr></thead>
                  <tbody>
                    {officialResults.map(r => (
                      <tr key={`${r.raceId}-${r.horseId}`} className={`border-t border-border ${r.disqualified ? "opacity-60 line-through" : ""}`}>
                        <td className="py-1.5 font-medium">#{r.rank}</td>
                        <td>{getHorse(r.horseId)?.name}</td>
                        <td>{getJockey(r.jockeyId)?.name}</td>
                        <td className="text-right font-mono">{r.finishTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Prize distribution</h4>
                <div className="text-[11px] text-muted-foreground mb-3">Pool ${Math.round(officialPool).toLocaleString()} · guaranteed min ${Math.round(officialGuaranteed).toLocaleString()}</div>
                <table className="w-full text-sm">
                  <thead><tr className="text-xs uppercase text-muted-foreground"><th className="text-left py-1.5">Rank</th><th className="text-right">Total</th><th className="text-right">Owner</th><th className="text-right">Jockey</th><th className="text-right">Mgmt</th></tr></thead>
                  <tbody>
                    {distribution.map(b => (
                      <tr key={b.rank} className="border-t border-border">
                        <td className="py-1.5">#{b.rank}</td>
                        <td className="text-right">${Math.round(b.total).toLocaleString()}</td>
                        <td className="text-right">${Math.round(b.owner).toLocaleString()}</td>
                        <td className="text-right">${Math.round(b.jockey).toLocaleString()}</td>
                        <td className="text-right">${Math.round(b.management).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Race chưa có kết quả chính thức. Theo dõi diễn biến trực tiếp ở trang race view.
            </div>
          )}
        </div>
      )}

      <h3 className="text-sm font-semibold text-foreground mt-8 mb-3">My Predictions</h3>
      <DataTable
        columns={[
          { key: "id", header: "ID" },
          { key: "race", header: "Race", render: p => getRace(p.raceId)?.id },
          { key: "horse", header: "Horse", render: p => getHorse(p.horseId)?.name },
          { key: "predictedRank", header: "Predicted", render: p => `#${p.predictedRank}` },
          { key: "status", header: "Status", render: p => <StatusBadge status={p.status} /> },
          { key: "payout", header: "Payout", render: p => p.status === "Won" ? <span className="text-success font-semibold">+${p.payout.toLocaleString()}</span> : p.status === "Lost" ? <span className="text-muted-foreground">$0</span> : "—" },
        ]}
        rows={predictions}
      />
      {predictions.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-6">No predictions yet. Submit your first one above.</div>
      )}
    </div>
  );
}
