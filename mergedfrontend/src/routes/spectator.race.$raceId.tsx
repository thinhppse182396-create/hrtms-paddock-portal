import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  seedPanels, racePhase, getCommitment, guaranteedMinimum, actualPrizePool, prizeBreakdown,
} from "@/lib/racing";
import { loadRaceControl, type RaceControlState } from "@/lib/raceControlStore";
import { ArrowLeft, Timer, TrendingUp, ShieldAlert, Trophy, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/spectator/race/$raceId")({ component: SpectatorRaceDetail });

function SpectatorRaceDetail() {
  const { raceId } = useParams({ from: "/spectator/race/$raceId" });
  const race = getRace(raceId);
  const panel = seedPanels.find(p => p.raceId === raceId);

  // Live race-control state: re-read on storage events + custom event from Admin page.
  const [control, setControl] = useState<RaceControlState | null>(() => loadRaceControl(raceId));
  useEffect(() => {
    const refresh = () => setControl(loadRaceControl(raceId));
    const onStorage = (e: StorageEvent) => { if (e.key === `raceControl:${raceId}`) refresh(); };
    const onCustom = (e: Event) => { if ((e as CustomEvent).detail === raceId) refresh(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("raceControl:update", onCustom);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("raceControl:update", onCustom); };
  }, [raceId]);

  const phase = control?.phase ?? (race ? racePhase(race, panel) : "PreRace");
  const entries = registrations.filter(r => r.raceId === raceId && r.status === "Approved");

  // mock live odds tick during PreRace
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (phase !== "PreRace") return;
    const id = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(id);
  }, [phase]);

  if (!race) {
    return (
      <div className="p-8">
        <p>Race not found.</p>
        <Link to="/spectator/dashboard"><Button className="mt-3"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
      </div>
    );
  }

  const commitment = getCommitment(raceId);
  const guaranteed = guaranteedMinimum(commitment, entries.length);
  const mockHandle = entries.length * 25000 + tick * 1500;
  const pool = actualPrizePool(commitment, entries.length, mockHandle);

  // Prefer simulated results from Admin race-control; fall back to seeded results.
  const simResults = control?.simResult?.results ?? null;
  const seeded = raceResults.filter(r => r.raceId === raceId);
  const results = simResults
    ? simResults.map(r => ({
        raceId, horseId: r.horseId, jockeyId: r.jockeyId,
        rank: r.rank, finishTime: `${r.finishSeconds.toFixed(2)}s`, disqualified: false,
      }))
    : seeded;
  const raceViolations = violations.filter(v => v.raceId === raceId);
  const reviewProgress = control ? Math.min(5, control.reviewStep) : 0;


  return (
    <div>
      <PageHeader
        title={`${race.id} — ${race.track}`}
        subtitle={`${race.date} ${race.time} • ${race.distance}m • ${race.lanes} lanes`}
        actions={<Link to="/spectator/predictions"><Button variant="ghost"><ArrowLeft className="h-4 w-4" /> Predict</Button></Link>}
      />

      {/* Phase banner */}
      <div className="mb-5 rounded-lg border border-border bg-card p-4 flex items-center gap-3">
        <PhaseDot phase={phase} />
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Spectator phase</div>
          <div className="text-lg font-bold text-foreground">{phaseLabel(phase)}</div>
        </div>
        <StatusBadge status={race.status} />
      </div>

      {phase === "PreRace" && (
        <section className="space-y-4">
          <Card title="Race card" icon={<Trophy className="h-4 w-4" />}>
            <RaceCard entries={entries} />
          </Card>
          <div className="grid md:grid-cols-3 gap-3">
            <Stat label="Live total handle (mock)" value={`$${mockHandle.toLocaleString()}`} accent />
            <Stat label="Guaranteed minimum pool" value={`$${guaranteed.toLocaleString()}`} />
            <Stat label="Projected pool" value={`$${pool.toLocaleString()}`} />
          </div>
          <Card title="Live toteboard (pari-mutuel)" icon={<TrendingUp className="h-4 w-4" />}>
            <table className="w-full text-sm">
              <thead><tr className="text-xs uppercase text-muted-foreground"><th className="text-left py-2">Horse</th><th className="text-left">Jockey</th><th className="text-right">Mock odds</th></tr></thead>
              <tbody>
                {entries.map((e, i) => {
                  const odds = (2.5 + (i + 1) * 0.8 + (tick % 5) * 0.1).toFixed(2);
                  return (
                    <tr key={e.id} className="border-t border-border">
                      <td className="py-2 font-medium">{getHorse(e.horseId)?.name}</td>
                      <td>{getJockey(e.jockeyId)?.name}</td>
                      <td className="text-right text-primary font-mono">{odds}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </section>
      )}

      {phase === "InProgress" && (
        <Card title="Race in progress" icon={<Timer className="h-4 w-4" />}>
          <p className="text-sm">Status: <b>In Progress</b> — final odds đã khóa, betting pool đã chốt ở <b>${mockHandle.toLocaleString()}</b>.</p>
          {control?.simResult ? (
            <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs">
              <div className="font-semibold text-primary flex items-center gap-1.5 mb-1"><FlaskConical className="h-3.5 w-3.5" /> Live trajectory feed</div>
              <div className="text-muted-foreground">{control.simResult.trajectory.length} frames • {control.simResult.results.length} runners • leader: {getHorse(control.simResult.results[0].horseId)?.name} ({control.simResult.results[0].finishSeconds.toFixed(2)}s projected).</div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">Đang chờ trọng tài nộp báo cáo / Admin chạy simulation.</p>
          )}
          <div className="mt-4"><RaceCard entries={entries} /></div>
        </Card>
      )}

      {phase === "Provisional" && (
        <Card title="Provisional finishing order" icon={<ShieldAlert className="h-4 w-4" />}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-warning/10 text-warning px-3 py-1 text-xs">⏳ Betting payouts đang giữ</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-muted text-foreground px-3 py-1 text-xs">Admin review: {reviewProgress}/5 bước</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-muted text-foreground px-3 py-1 text-xs">Panel signed: {control?.panelSignedCount ?? 0}/3</span>
          </div>
          <ReviewChecklist step={reviewProgress} signed={control?.panelSignedCount ?? 0} />
          <ResultsTable results={results} violations={raceViolations} />
        </Card>
      )}


      {phase === "Official" && (
        <div className="space-y-4">
          <Card title="Official results" icon={<Trophy className="h-4 w-4" />}>
            <ResultsTable results={results} violations={raceViolations} />
          </Card>
          <Card title="Prize distribution">
            <table className="w-full text-sm">
              <thead><tr className="text-xs uppercase text-muted-foreground"><th className="text-left py-2">Rank</th><th className="text-right">Total</th><th className="text-right">Owner</th><th className="text-right">Jockey</th><th className="text-right">Mgmt</th></tr></thead>
              <tbody>
                {prizeBreakdown(pool, entries.length).map(b => (
                  <tr key={b.rank} className="border-t border-border">
                    <td className="py-2">#{b.rank}</td>
                    <td className="text-right">${b.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="text-right">${b.owner.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="text-right">${b.jockey.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="text-right">${b.management.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}

function phaseLabel(p: string) {
  const map: Record<string, string> = { PreRace: "Pre-race", InProgress: "In Progress", Provisional: "Provisional", Official: "Official" };
  return map[p] ?? p;
}
function PhaseDot({ phase }: { phase: string }) {
  const cls = phase === "PreRace" ? "bg-info" : phase === "InProgress" ? "bg-warning animate-pulse" : phase === "Provisional" ? "bg-warning" : "bg-success";
  return <div className={`h-3 w-3 rounded-full ${cls}`} />;
}
function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">{icon}{title}</h3>
      {children}
    </div>
  );
}
function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-md border p-3 ${accent ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30"}`}>
      <div className="text-[11px] uppercase text-muted-foreground tracking-wide">{label}</div>
      <div className={`mt-1 font-semibold ${accent ? "text-primary text-lg" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
function RaceCard({ entries }: { entries: any[] }) {
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">Chưa có registration approved.</p>;
  return (
    <table className="w-full text-sm">
      <thead><tr className="text-xs uppercase text-muted-foreground"><th className="text-left py-2">#</th><th className="text-left">Horse</th><th className="text-left">Breed</th><th className="text-left">Jockey</th></tr></thead>
      <tbody>
        {entries.map((e, i) => {
          const h = getHorse(e.horseId), j = getJockey(e.jockeyId);
          return (
            <tr key={e.id} className="border-t border-border">
              <td className="py-2">{i + 1}</td>
              <td className="font-medium text-foreground">{h?.name}</td>
              <td>{h?.breed}</td>
              <td>{j?.name}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
function ResultsTable({ results, violations }: { results: any[]; violations: any[] }) {
  if (results.length === 0) return <p className="text-sm text-muted-foreground">Chưa có kết quả.</p>;
  return (
    <>
      <table className="w-full text-sm">
        <thead><tr className="text-xs uppercase text-muted-foreground"><th className="text-left py-2">Rank</th><th className="text-left">Horse</th><th className="text-left">Jockey</th><th className="text-right">Finish</th></tr></thead>
        <tbody>
          {results.map(r => (
            <tr key={`${r.raceId}-${r.horseId}`} className={`border-t border-border ${r.disqualified ? "opacity-60 line-through" : ""}`}>
              <td className="py-2">#{r.rank}</td>
              <td className="font-medium">{getHorse(r.horseId)?.name}</td>
              <td>{getJockey(r.jockeyId)?.name}</td>
              <td className="text-right font-mono">{r.finishTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {violations.length > 0 && (
        <div className="mt-3 rounded-md border border-warning/40 bg-warning/5 p-3 text-xs">
          <div className="font-semibold text-warning mb-1">Violations</div>
          {violations.map(v => (
            <div key={v.id}>• <b>{v.type}</b> ({v.severity}) — {getHorse(v.horseId)?.name} / {getJockey(v.jockeyId)?.name}: {v.description}</div>
          ))}
        </div>
      )}
    </>
  );
}

function ReviewChecklist({ step, signed }: { step: number; signed: number }) {
  const steps = [
    "Completeness check (finish times, panel signatures, violation codes)",
    "Consistency check (rank order, no duplicates, finishers ≤ starters)",
    "Violation resolution (uphold / dismiss từng vi phạm)",
    "Provisional flag resolution (clear hoặc disqualify)",
    "Ranking verification (system recompute, Admin xác nhận)",
  ];
  return (
    <div className="mb-4 rounded-md border border-border bg-muted/30 p-3">
      <div className="text-xs font-semibold text-foreground mb-2">Admin 5-step review · Panel signatures {signed}/3</div>
      <ol className="space-y-1.5">
        {steps.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={i} className={`flex items-start gap-2 text-xs ${done ? "text-success" : active ? "text-foreground" : "text-muted-foreground"}`}>
              <span className={`mt-0.5 inline-flex h-4 w-4 rounded-full items-center justify-center text-[10px] ${done ? "bg-success text-success-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {done ? "✓" : i + 1}
              </span>
              <span>{s}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
