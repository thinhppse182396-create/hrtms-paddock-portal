import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getRace, getTournament, referees, registrations, getHorse, getJockey } from "@/data/databaseData";
import {
  seedRounds, seedPanels, validateRoundSchedule, validatePanel, panelSigned,
  getCommitment, guaranteedMinimum, actualPrizePool, prizeBreakdown,
  simulateRace, type RaceRound, type RefereePanel,
} from "@/lib/racing";
import { loadRaceControl, saveRaceControl, type ControlPhase } from "@/lib/raceControlStore";
import { deleteRound, syncRefereePanel, syncRound } from "@/lib/backendApi";
import { ArrowLeft, Play, FlaskConical, CheckCircle2, AlertTriangle, Radio } from "lucide-react";

export const Route = createFileRoute("/admin/race-control/$raceId")({ component: RaceControlPage });

function RaceControlPage() {
  const { raceId } = useParams({ from: "/admin/race-control/$raceId" });
  const race = getRace(raceId);
  const [rounds, setRounds] = useState<RaceRound[]>(seedRounds.filter(r => r.raceId === raceId));
  const [panel, setPanel] = useState<RefereePanel>(
    seedPanels.find(p => p.raceId === raceId) ?? {
      raceId, members: [
        { refereeId: "", role: "Lead", signed: false },
        { refereeId: "", role: "Member", signed: false },
        { refereeId: "", role: "Member", signed: false },
      ],
    },
  );
  const [simResult, setSimResult] = useState<ReturnType<typeof simulateRace> | null>(null);
  const [reviewStep, setReviewStep] = useState(0);
  const [phase, setPhase] = useState<ControlPhase>("PreRace");
  const [controlLoaded, setControlLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void loadRaceControl(raceId).then(persisted => {
      if (!active || !persisted) return;
      setSimResult(persisted.simResult ?? null);
      setReviewStep(persisted.reviewStep);
      setPhase(persisted.phase);
      if (persisted.panel) setPanel(persisted.panel);
    }).finally(() => {
      if (active) setControlLoaded(true);
    });
    return () => { active = false; };
  }, [raceId]);

  const confirmedRegs = useMemo(
    () => registrations.filter(rg => rg.raceId === raceId && rg.status === "Approved"),
    [raceId],
  );
  const commitment = getCommitment(raceId);
  const guaranteed = guaranteedMinimum(commitment, confirmedRegs.length);
  const totalHandle = 0;
  const pool = actualPrizePool(commitment, confirmedRegs.length, totalHandle);
  const breakdown = prizeBreakdown(pool, confirmedRegs.length);

  if (!race) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Race not found.</p>
        <Link to="/admin/races"><Button className="mt-3"><ArrowLeft className="h-4 w-4" /> Back to Races</Button></Link>
      </div>
    );
  }

  const addRound = async () => {
    const latest = [...rounds].sort((a, b) => b.startTime.localeCompare(a.startTime))[0];
    const startTime = latest ? addMinutes(latest.startTime, 40) : race.time;
    try {
      const saved = await syncRound({ raceId, type: "Heat", startTime }, race.date);
      setRounds(current => [...current, {
        id: String(saved.roundId),
        backendId: saved.roundId,
        raceId,
        type: "Heat",
        startTime,
        status: "Scheduled",
      }]);
      toast.success("Round added", { description: `${raceId} at ${startTime}` });
    } catch (error: any) {
      toast.error("Cannot add round", { description: error?.message });
    }
  };
  const updateRound = (i: number, patch: Partial<RaceRound>) => {
    setRounds(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  };
  const saveRound = async (i: number) => {
    const round = rounds[i];
    try {
      const saved = await syncRound(round, race.date);
      setRounds(current => current.map((item, index) => index === i ? {
        ...item,
        id: String(saved.roundId),
        backendId: saved.roundId,
      } : item));
      toast.success("Round saved", { description: `${raceId} at ${round.startTime}` });
    } catch (error: any) {
      toast.error("Cannot save round", { description: error?.message });
    }
  };
  const removeRound = async (i: number) => {
    const round = rounds[i];
    try {
      if (round.backendId) await deleteRound(round.backendId);
      setRounds(current => current.filter((_, index) => index !== i));
      toast.success("Round removed", { description: round.id });
    } catch (error: any) {
      toast.error("Cannot remove round", { description: error?.message });
    }
  };
  const roundErr = validateRoundSchedule(rounds);

  const setMember = (i: number, refereeId: string) => {
    setPanel(p => ({ ...p, members: p.members.map((m, idx) => ({ ...m, refereeId: idx === i ? refereeId : m.refereeId, signed: false, signedAt: undefined })) }));
  };
  const setLead = (i: number) => {
    setPanel(p => ({ ...p, members: p.members.map((m, idx) => ({ ...m, role: idx === i ? "Lead" : "Member", signed: false, signedAt: undefined })) }));
  };
  const sign = (i: number) => {
    setPanel(p => ({ ...p, members: p.members.map((m, idx) => idx === i ? { ...m, signed: true, signedAt: new Date().toISOString() } : m) }));
  };
  const panelErr = validatePanel(panel);
  const savePanel = async () => {
    if (panelErr) {
      toast.error("Cannot save panel", { description: panelErr });
      return;
    }
    try {
      await syncRefereePanel(panel);
      setPanel(current => ({ ...current, backendId: current.backendId ?? `RP-${raceId}` }));
      toast.success("Referee panel saved", { description: raceId });
    } catch (error: any) {
      toast.error("Cannot save panel", { description: error?.message });
    }
  };

  const runSimulation = () => {
    if (confirmedRegs.length === 0) { toast.error("Chưa có registration approved"); return; }
    const entries = confirmedRegs.map(rg => ({
      horseId: rg.horseId, jockeyId: rg.jockeyId,
      baseSpeed: 16 + Math.random() * 2,
      jockeyBonus: 0.02 + Math.random() * 0.05,
    }));
    const sim = simulateRace(race.distance, entries);
    setSimResult(sim);
    toast.success("Simulation complete", { description: `${sim.results.length} ngựa, finish time: ${sim.results[0].finishSeconds.toFixed(2)}s` });
  };

  const reviewSteps = [
    { key: "completeness", label: "Completeness check", desc: "All horses have finish time, 3 panel signatures, structured violation codes." },
    { key: "consistency",  label: "Consistency check",  desc: "Finish times ordered, no duplicate ranks, finishers ≤ starters." },
    { key: "violations",   label: "Violation resolution", desc: "Admin uphold or dismiss each violation." },
    { key: "provisional",  label: "Provisional flag resolution", desc: "Clear or disqualify each flagged horse." },
    { key: "ranking",      label: "Ranking verification", desc: "System recomputes ranking, Admin confirms." },
  ];

  // Auto-derive phase from progress and persist whenever anything changes.
  const signedCount = panel.members.filter(m => m.signed).length;
  useEffect(() => {
    if (!controlLoaded) return;
    let derived: ControlPhase = phase;
    if (phase === "PreRace" && simResult) derived = "InProgress";
    if ((derived === "InProgress") && simResult) derived = "Provisional";
    if (derived === "Provisional" && reviewStep === reviewSteps.length && panelSigned(panel)) derived = "Official";
    if (derived !== phase) setPhase(derived);
    void saveRaceControl({
      raceId, phase: derived, reviewStep, panelSignedCount: signedCount,
      panel, simResult: simResult ?? undefined, updatedAt: "",
    });
  }, [simResult, reviewStep, signedCount, panel, phase, raceId, controlLoaded]);

  const advancePhase = (next: ControlPhase) => { setPhase(next); toast.success(`Phase → ${next}`); };
  const resetControl = () => {
    setSimResult(null); setReviewStep(0); setPhase("PreRace");
    void saveRaceControl({ raceId, phase: "PreRace", reviewStep: 0, panelSignedCount: signedCount, panel, updatedAt: "" });
    toast.message("Đã reset race control về Pre-Race");
  };


  return (
    <div>
      <PageHeader
        title={`Race Control — ${race.id}`}
        subtitle={`${getTournament(race.tournamentId)?.name} • ${race.track} • ${race.date} ${race.time}`}
        actions={
          <div className="flex gap-2">
            <Link to="/spectator/race/$raceId" params={{ raceId }} target="_blank"><Button variant="secondary"><Radio className="h-4 w-4" /> Spectator view</Button></Link>
            <Link to="/admin/races"><Button variant="ghost"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
          </div>
        }
      />

      {/* Phase control — broadcasts to Spectator page */}
      <section className="bg-card border border-border rounded-lg p-5 mb-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${phase === "InProgress" ? "bg-warning animate-pulse" : phase === "Official" ? "bg-success" : phase === "Provisional" ? "bg-warning" : "bg-info"}`} />
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Broadcast phase</div>
              <div className="font-semibold text-foreground">{phase}</div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["PreRace","InProgress","Provisional","Official"] as ControlPhase[]).map(p => (
              <Button key={p} variant={p === phase ? "primary" : "ghost"} onClick={() => advancePhase(p)}>{p}</Button>
            ))}
            <Button variant="danger" onClick={resetControl}>Reset</Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Phase được derive theo simulation + panel sign + review step và đồng bộ sang trang Spectator (Pre → InProgress → Provisional → Official).</p>
      </section>


      {/* Rounds ---------------------------------------------------- */}
      <section className="bg-card border border-border rounded-lg p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Rounds (Heat → Semi-Final → Final)</h3>
          <Button onClick={addRound}>Add round</Button>
        </div>
        <div className="space-y-2">
          {rounds.map((r, i) => (
            <div key={r.id} className="grid grid-cols-5 gap-2 items-center text-sm">
              <select className="px-2 py-1.5 border border-input rounded bg-background" value={r.type} onChange={e => updateRound(i, { type: e.target.value as any })}>
                <option>Heat</option><option>Semi-Final</option><option>Final</option>
              </select>
              <input type="time" className="px-2 py-1.5 border border-input rounded bg-background" value={r.startTime} onChange={e => updateRound(i, { startTime: e.target.value })} />
              <StatusBadge status={r.status} />
              <span className="text-xs text-muted-foreground">{r.id}</span>
              <div className="flex gap-1">
                <Button variant="ghost" onClick={() => void saveRound(i)}>Save</Button>
                <Button variant="danger" onClick={() => void removeRound(i)}>Remove</Button>
              </div>
            </div>
          ))}
          {rounds.length === 0 && <p className="text-xs text-muted-foreground">No rounds yet.</p>}
        </div>
        {roundErr && (
          <div className="mt-3 flex items-start gap-2 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 mt-0.5" /> {roundErr}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">Tối thiểu 40 phút nghỉ giữa các round (IFHA/Ontario).</p>
      </section>

      {/* Referee panel --------------------------------------------- */}
      <section className="bg-card border border-border rounded-lg p-5 mb-5">
        <h3 className="font-semibold text-foreground mb-3">Referee Panel — 3 trọng tài (1 Lead + 2 Members)</h3>
        <div className="space-y-2">
          {panel.members.map((m, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 items-center text-sm">
              <select className="px-2 py-1.5 border border-input rounded bg-background col-span-2" value={m.refereeId} onChange={e => setMember(i, e.target.value)}>
                <option value="">— Chọn trọng tài —</option>
                {referees.filter(r => r.status === "Active").map(r => <option key={r.id} value={r.id}>{r.name} • {r.licenseNo}</option>)}
              </select>
              <label className="text-xs flex items-center gap-2">
                <input type="radio" name="lead" checked={m.role === "Lead"} onChange={() => setLead(i)} /> Lead
              </label>
              <span className="text-xs">{m.signed ? <span className="text-success">✓ Signed</span> : <span className="text-muted-foreground">Pending sign</span>}</span>
              <Button variant={m.signed ? "ghost" : "primary"} disabled={m.signed || !m.refereeId} onClick={() => sign(i)}>
                {m.signed ? "Signed" : "Co-sign"}
              </Button>
            </div>
          ))}
        </div>
        {panelErr && <div className="mt-2 text-sm text-danger flex gap-2 items-center"><AlertTriangle className="h-4 w-4" /> {panelErr}</div>}
        <Button className="mt-3" onClick={() => void savePanel()} disabled={!!panelErr}>Save panel</Button>
        <p className="text-xs text-muted-foreground mt-2">RefereeReport được tính là <b>signed</b> khi cả 3 thành viên co-sign.</p>
      </section>

      {/* Prize pool ------------------------------------------------ */}
      <section className="bg-card border border-border rounded-lg p-5 mb-5">
        <h3 className="font-semibold text-foreground mb-3">Prize Pool Computation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Stat label="Organizer added" value={`$${commitment.organizerAddedMoney.toLocaleString()}`} />
          <Stat label="Sponsorship"      value={`$${commitment.sponsorshipAmount.toLocaleString()}`} />
          <Stat label={`Entry fee × ${confirmedRegs.length}`} value={`$${(commitment.entryFeePerHorse * confirmedRegs.length).toLocaleString()}`} />
          <Stat label="Guaranteed min"  value={`$${guaranteed.toLocaleString()}`} highlight />
          <Stat label="Recorded total handle" value={`$${totalHandle.toLocaleString()}`} />
          <Stat label="Betting contribution (20%×40%)" value={`$${(totalHandle * 0.2 * 0.4).toLocaleString()}`} />
          <Stat label="ACTUAL PRIZE POOL" value={`$${pool.toLocaleString()}`} highlight />
          <Stat label="Confirmed horses" value={String(confirmedRegs.length)} />
        </div>
        <table className="w-full mt-4 text-sm border-t border-border">
          <thead><tr className="text-xs uppercase text-muted-foreground"><th className="py-2 text-left">Rank</th><th className="text-right">Total</th><th className="text-right">Owner 80%</th><th className="text-right">Jockey 10%</th><th className="text-right">Mgmt 10%</th></tr></thead>
          <tbody>
            {breakdown.map(b => (
              <tr key={b.rank} className="border-t border-border">
                <td className="py-2">#{b.rank} ({Math.round([60,20,10,5,3,2][b.rank-1])}%)</td>
                <td className="text-right">${b.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="text-right">${b.owner.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="text-right">${b.jockey.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="text-right">${b.management.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Simulation ------------------------------------------------ */}
      <section className="bg-card border border-border rounded-lg p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2"><FlaskConical className="h-4 w-4" /> Race Simulation Engine</h3>
            <p className="text-xs text-muted-foreground">Tạo trajectoryData + resultData trong 1 lần chạy — inject như RefereeReport chính thức.</p>
          </div>
          <Button onClick={runSimulation}><Play className="h-4 w-4" /> Run simulation</Button>
        </div>
        {simResult && (
          <div className="text-sm">
            <div className="text-xs text-muted-foreground mb-2">{simResult.trajectory.length} frames • {simResult.results.length} finishers</div>
            <table className="w-full">
              <thead><tr className="text-xs uppercase text-muted-foreground"><th className="text-left py-2">Rank</th><th className="text-left">Horse</th><th className="text-left">Jockey</th><th className="text-right">Finish (s)</th></tr></thead>
              <tbody>
                {simResult.results.map(r => (
                  <tr key={r.horseId} className="border-t border-border">
                    <td className="py-2">#{r.rank}</td>
                    <td>{getHorse(r.horseId)?.name ?? r.horseId}</td>
                    <td>{getJockey(r.jockeyId)?.name ?? r.jockeyId}</td>
                    <td className="text-right">{r.finishSeconds.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Admin 5-step review --------------------------------------- */}
      <section className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-semibold text-foreground mb-3">Admin Review (5 bước, §6.2)</h3>
        <ol className="space-y-2">
          {reviewSteps.map((s, i) => (
            <li key={s.key} className={`flex items-start gap-3 rounded-md p-3 ${i < reviewStep ? "bg-success/10" : i === reviewStep ? "bg-primary/10" : "bg-muted/30"}`}>
              <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center text-xs ${i < reviewStep ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
                {i < reviewStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
              {i === reviewStep && (
                <Button onClick={() => setReviewStep(reviewStep + 1)}>Confirm step</Button>
              )}
            </li>
          ))}
        </ol>
        {reviewStep === reviewSteps.length && (
          <div className="mt-4 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">
            ✓ Tất cả 5 bước đã xác nhận — có thể Publish official result.
          </div>
        )}
        <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
          <div className="rounded border border-border p-2"><b className="text-foreground">≤ 15min</b><br/>Provisional</div>
          <div className="rounded border border-border p-2"><b className="text-foreground">≤ 2h</b><br/>Panel signs report</div>
          <div className="rounded border border-border p-2"><b className="text-foreground">≤ 4h</b><br/>Admin publish</div>
          <div className="rounded border border-border p-2"><b className="text-foreground">≤ 24h</b><br/>Award announce</div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-md border p-3 ${highlight ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30"}`}>
      <div className="text-[11px] uppercase text-muted-foreground tracking-wide">{label}</div>
      <div className={`mt-1 font-semibold ${highlight ? "text-primary text-lg" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function addMinutes(time: string, minutes: number) {
  const [hours, currentMinutes] = time.split(":").map(Number);
  const total = (hours || 0) * 60 + (currentMinutes || 0) + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
