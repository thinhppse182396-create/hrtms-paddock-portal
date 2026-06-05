import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { Flag, ShieldCheck, AlertTriangle, Play } from "lucide-react";
import {
  races, horses, jockeys, registrations,
  getRace, getHorse, getJockey,
} from "@/data/mockData";
import { toast } from "sonner";

export const Route = createFileRoute("/referee/pre-race-check")({ component: PreRaceCheck });

type CheckState = "ok" | "fail" | undefined;

interface RaceCheck {
  raceId: string;
  horses: Record<string, { state: CheckState; reason?: string }>;
  jockeys: Record<string, { state: CheckState; reason?: string }>;
  submittedAt?: string;
  startedAt?: string;
  cancelled?: boolean;
  cancelReason?: string;
}

const STORAGE_KEY = "preRaceChecks";

function loadChecks(): Record<string, RaceCheck> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function PreRaceCheck() {
  const [hydrated, setHydrated] = useState(false);
  const [allChecks, setAllChecks] = useState<Record<string, RaceCheck>>({});
  const [raceId, setRaceId] = useState<string>("");

  useEffect(() => {
    setAllChecks(loadChecks());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(allChecks)); } catch {/* */}
  }, [allChecks, hydrated]);

  // Race that needs a check = Scheduled or Ongoing and not yet cancelled
  const checkableRaces = races.filter(r => r.status === "Scheduled" || r.status === "Ongoing");
  useEffect(() => {
    if (!raceId && checkableRaces.length) setRaceId(checkableRaces[0].id);
  }, [raceId, checkableRaces]);

  const race = raceId ? getRace(raceId) : null;
  const current: RaceCheck = allChecks[raceId] ?? { raceId, horses: {}, jockeys: {} };
  const locked = !!current.submittedAt || !!current.startedAt || !!current.cancelled;

  // Field for this race: approved registrations
  const field = useMemo(() => {
    if (!raceId) return [] as Array<{ horseId: string; jockeyId: string }>;
    return registrations
      .filter(r => r.raceId === raceId && r.status === "Approved")
      .map(r => ({ horseId: r.horseId, jockeyId: r.jockeyId }));
  }, [raceId]);

  const fieldHorses = field.map(f => getHorse(f.horseId)!).filter(Boolean);
  const fieldJockeys = field.map(f => getJockey(f.jockeyId)!).filter(Boolean);

  const setHorseCheck = (id: string, state: CheckState, reason?: string) =>
    setAllChecks(s => ({
      ...s,
      [raceId]: {
        ...current,
        horses: { ...current.horses, [id]: { state, reason } },
      },
    }));

  const setJockeyCheck = (id: string, state: CheckState, reason?: string) =>
    setAllChecks(s => ({
      ...s,
      [raceId]: {
        ...current,
        jockeys: { ...current.jockeys, [id]: { state, reason } },
      },
    }));

  // Counts
  const horseCounts = {
    ok: fieldHorses.filter(h => current.horses[h.id]?.state === "ok").length,
    fail: fieldHorses.filter(h => current.horses[h.id]?.state === "fail").length,
    pending: fieldHorses.filter(h => !current.horses[h.id]?.state).length,
  };
  const jockeyCounts = {
    ok: fieldJockeys.filter(j => current.jockeys[j.id]?.state === "ok").length,
    fail: fieldJockeys.filter(j => current.jockeys[j.id]?.state === "fail").length,
    pending: fieldJockeys.filter(j => !current.jockeys[j.id]?.state).length,
  };
  const totalPending = horseCounts.pending + jockeyCounts.pending;
  const totalFlagged = horseCounts.fail + jockeyCounts.fail;

  // Eligible (non-disqualified) pairs remaining for race start
  const eligiblePairs = field.filter(
    p => current.horses[p.horseId]?.state !== "fail" && current.jockeys[p.jockeyId]?.state !== "fail"
  );

  const canSubmit = !locked && totalPending === 0 && field.length > 0;
  const canStart = !!current.submittedAt && !current.startedAt && !current.cancelled && eligiblePairs.length >= 2;

  const submit = () => {
    if (!canSubmit) return;
    setAllChecks(s => ({
      ...s,
      [raceId]: { ...current, submittedAt: new Date().toISOString() },
    }));
    if (totalFlagged > 0) {
      toast.warning(`Pre-race check submitted with ${totalFlagged} flagged`, {
        description: `${horseCounts.fail} horse(s) and ${jockeyCounts.fail} jockey(s) disqualified. Race will continue with ${eligiblePairs.length} pair(s).`,
      });
    } else {
      toast.success("Pre-race check passed", { description: "All horses and jockeys cleared." });
    }
  };

  const startRace = () => {
    if (!canStart) return;
    setAllChecks(s => ({
      ...s,
      [raceId]: { ...current, startedAt: new Date().toISOString() },
    }));
    toast.success("Race started", { description: `${race?.id} · ${eligiblePairs.length} pair(s) racing.` });
  };

  const cancelRace = () => {
    const reason = window.prompt("Reason for cancelling this race?") ?? "";
    if (!reason.trim()) return;
    setAllChecks(s => ({
      ...s,
      [raceId]: { ...current, cancelled: true, cancelReason: reason.trim(), submittedAt: current.submittedAt ?? new Date().toISOString() },
    }));
    toast.error("Race cancelled", { description: reason });
  };

  const resetChecks = () => {
    if (!window.confirm("Reset all checks for this race? Submitted state will be cleared.")) return;
    setAllChecks(s => {
      const next = { ...s };
      delete next[raceId];
      return next;
    });
  };

  // Build a flat list of horses/jockeys to display: field first, then any remaining mock entries
  const horseRows = fieldHorses.length ? fieldHorses : horses;
  const jockeyRows = fieldJockeys.length ? fieldJockeys : jockeys;

  const stateLabel = (race: ReturnType<typeof getRace>) => {
    if (current.cancelled) return "Cancelled";
    if (current.startedAt) return "Race Started";
    if (current.submittedAt) return "Check Submitted";
    return race?.status ?? "—";
  };

  return (
    <div>
      <PageHeader
        title="Pre-Race Check"
        subtitle="Verify horses & jockeys. Flagged entries are disqualified — the race continues with the remaining field."
      />

      {/* Race picker + status */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Race</label>
          <select
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            value={raceId}
            onChange={e => setRaceId(e.target.value)}
          >
            {checkableRaces.length === 0 && <option value="">— No race needs checking —</option>}
            {checkableRaces.map(r => (
              <option key={r.id} value={r.id}>
                {r.id} · {r.track} · {r.date} {r.time} · {r.status}
              </option>
            ))}
          </select>
          {race && (
            <span className="text-xs text-muted-foreground">
              · {field.length} approved pair(s)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Status:</span>
          <StatusBadge status={stateLabel(race ?? undefined)} />
        </div>
      </div>

      {race && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">Eligible</div>
              <div className="text-2xl font-bold text-success mt-1">{horseCounts.ok + jockeyCounts.ok}</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">Flagged</div>
              <div className="text-2xl font-bold text-destructive mt-1">{totalFlagged}</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">Pending</div>
              <div className="text-2xl font-bold text-foreground mt-1">{totalPending}</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">Racing pairs</div>
              <div className="text-2xl font-bold text-primary mt-1">{eligiblePairs.length}</div>
            </div>
          </div>

          {/* Action bar */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              {current.cancelled ? (
                <span className="inline-flex items-center gap-2 text-destructive font-medium">
                  <AlertTriangle className="h-4 w-4" /> Cancelled: {current.cancelReason}
                </span>
              ) : current.startedAt ? (
                <span className="inline-flex items-center gap-2 text-success font-medium">
                  <Play className="h-4 w-4" /> Race started at {new Date(current.startedAt).toLocaleTimeString()}
                </span>
              ) : current.submittedAt ? (
                <span className="inline-flex items-center gap-2 text-foreground font-medium">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Check submitted — ready to start race
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Mark each horse & jockey, then submit. Flagged entries will be disqualified.
                </span>
              )}
              {!canStart && current.submittedAt && !current.startedAt && !current.cancelled && (
                <div className="text-xs text-destructive mt-1">
                  Need ≥ 2 eligible horse-jockey pairs to start. Cancel the race if not enough.
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!current.submittedAt && (
                <Button onClick={submit} disabled={!canSubmit}>
                  <ShieldCheck className="h-4 w-4" /> Submit Check
                </Button>
              )}
              {current.submittedAt && !current.startedAt && !current.cancelled && (
                <Button onClick={startRace} disabled={!canStart}>
                  <Play className="h-4 w-4" /> Start Race
                </Button>
              )}
              {!current.cancelled && !current.startedAt && (
                <Button variant="danger" onClick={cancelRace}>
                  <Flag className="h-4 w-4" /> Cancel Race
                </Button>
              )}
              <Button variant="secondary" onClick={resetChecks}>Reset</Button>
            </div>
          </div>

          <h2 className="text-sm font-semibold text-foreground mb-3">Horses</h2>
          <div className="mb-6">
            <DataTable
              columns={[
                { key: "name", header: "Horse" },
                { key: "age", header: "Age" },
                { key: "weight", header: "Weight (kg)" },
                { key: "healthCertExpiry", header: "Health Cert" },
                { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
                { key: "check", header: "Eligibility", render: r => {
                  const c = current.horses[r.id];
                  return (
                    <div className="flex flex-col gap-1 min-w-[240px]">
                      <div className="flex gap-2">
                        <Button
                          variant={c?.state === "ok" ? "primary" : "secondary"}
                          disabled={locked}
                          onClick={() => setHorseCheck(r.id, "ok")}
                        >Eligible</Button>
                        <Button
                          variant={c?.state === "fail" ? "danger" : "secondary"}
                          disabled={locked}
                          onClick={() => setHorseCheck(r.id, "fail", c?.reason ?? "")}
                        >Disqualify</Button>
                      </div>
                      {c?.state === "fail" && (
                        <input
                          className="px-2 py-1 border border-input rounded text-xs"
                          placeholder="Reason (required)"
                          value={c.reason ?? ""}
                          disabled={locked}
                          onChange={e => setHorseCheck(r.id, "fail", e.target.value)}
                        />
                      )}
                    </div>
                  );
                }},
              ]}
              rows={horseRows}
            />
          </div>

          <h2 className="text-sm font-semibold text-foreground mb-3">Jockeys</h2>
          <DataTable
            columns={[
              { key: "name", header: "Jockey" },
              { key: "licenseNo", header: "License No" },
              { key: "weight", header: "Weight (kg)" },
              { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
              { key: "check", header: "Eligibility", render: r => {
                const c = current.jockeys[r.id];
                return (
                  <div className="flex flex-col gap-1 min-w-[240px]">
                    <div className="flex gap-2">
                      <Button
                        variant={c?.state === "ok" ? "primary" : "secondary"}
                        disabled={locked}
                        onClick={() => setJockeyCheck(r.id, "ok")}
                      >Eligible</Button>
                      <Button
                        variant={c?.state === "fail" ? "danger" : "secondary"}
                        disabled={locked}
                        onClick={() => setJockeyCheck(r.id, "fail", c?.reason ?? "")}
                      >Disqualify</Button>
                    </div>
                    {c?.state === "fail" && (
                      <input
                        className="px-2 py-1 border border-input rounded text-xs"
                        placeholder="Reason (required)"
                        value={c.reason ?? ""}
                        disabled={locked}
                        onChange={e => setJockeyCheck(r.id, "fail", e.target.value)}
                      />
                    )}
                  </div>
                );
              }},
            ]}
            rows={jockeyRows}
          />
        </>
      )}
    </div>
  );
}
