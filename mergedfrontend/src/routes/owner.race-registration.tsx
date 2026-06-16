import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { usePersistentCollection } from "@/hooks/usePersistentCollection";
import {
  checkJockeyDailyEntries,
  checkHorseRest,
  checkRegistrationDeadline,
  checkJockeySwapLock,
  type RaceDayEntry,
  type ConstraintIssue,
} from "@/lib/racing";
import { CheckCircle2, XCircle, Info, AlertTriangle, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/owner/race-registration")({ component: RaceRegistration });

const OWNER_ID = "O001";

type Reg = (typeof regSeed)[number] & { reason?: string; backupJockeyId?: string };

function RaceRegistration() {
  const [registrations, setRegistrations] = usePersistentCollection<Reg>("admin:registrations", regSeed as Reg[]);
  const [allHorses] = usePersistentCollection<Horse>("owner:horses", horseSeed);

  const [open, setOpen] = useState(false);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [selectedHorseId, setSelectedHorseId] = useState<string | null>(null);
  const [selectedJockeyId, setSelectedJockeyId] = useState<string>(jockeys[0]?.id ?? "");
  const [backupJockeyId, setBackupJockeyId] = useState<string>("");

  const openRaces = races.filter(r => r.status === "Scheduled");
  const myHorses = useMemo(() => allHorses.filter(h => h.ownerId === OWNER_ID), [allHorses]);
  const selectedRace = openRaces.find(r => r.id === selectedRaceId) ?? null;
  const eligibleList = selectedRace ? myHorses.map(h => ({ horse: h, check: isHorseEligibleForRace(h, selectedRace) })) : [];

  const entries: RaceDayEntry[] = useMemo(() => registrations
    .filter(r => r.status !== "Rejected")
    .map(r => {
      const race = races.find(x => x.id === r.raceId);
      if (!race) return null;
      return { raceId: race.id, date: race.date, startTime: race.time, trackId: race.track, jockeyId: r.jockeyId, horseId: r.horseId } as RaceDayEntry;
    })
    .filter(Boolean) as RaceDayEntry[], [registrations]);

  const constraintIssues: ConstraintIssue[] = useMemo(() => {
    if (!selectedRace) return [];
    const all: ConstraintIssue[] = [];
    all.push(...checkRegistrationDeadline(selectedRace.date));
    const raceDateTime = new Date(`${selectedRace.date}T${selectedRace.time || "00:00"}:00`);
    all.push(...checkJockeySwapLock(raceDateTime));
    if (selectedJockeyId) all.push(...checkJockeyDailyEntries(selectedJockeyId, selectedRace.date, entries));
    if (selectedHorseId) all.push(...checkHorseRest(selectedHorseId, selectedRace.date, entries));
    return all;
  }, [selectedRace, selectedJockeyId, selectedHorseId, entries]);

  // Hard blocker: a horse already registered (not rejected/cancelled) for this race.
  const duplicate = !!selectedRace && !!selectedHorseId && registrations.some(
    r => r.raceId === selectedRace.id && r.horseId === selectedHorseId && r.status !== "Rejected" && r.status !== "Cancelled",
  );
  const canSubmit = !!selectedHorseId && !!selectedJockeyId && !duplicate;

  const submit = () => {
    if (!selectedRace || !selectedHorseId || !selectedJockeyId) return;
    const max = registrations.reduce((m, r) => Math.max(m, Number(String(r.id).replace(/\D/g, "")) || 0), 0);
    const reg: Reg = {
      id: `RG${String(max + 1).padStart(3, "0")}`,
      raceId: selectedRace.id,
      horseId: selectedHorseId,
      jockeyId: selectedJockeyId,
      ownerId: OWNER_ID,
      status: "Pending",
      submittedAt: new Date().toISOString().slice(0, 10),
      ...(backupJockeyId ? { backupJockeyId } : {}),
    };
    setRegistrations(rs => [...rs, reg]);
    setOpen(false);
    setSelectedHorseId(null);
    setBackupJockeyId("");
    toast.success("Registration submitted", { description: `${reg.id} • awaiting admin approval` });
  };

  return (
    <div>
      <PageHeader title="Race Registration" subtitle="Quy tắc HRTMS: ≥5 ngày trước race · Ngựa nghỉ ≥6 ngày · Nài ≤3 ngựa/ngày" />
      <DataTable
        columns={[
          { key: "id", header: "Race" },
          { key: "tournament", header: "Tournament", render: r => getTournament(r.tournamentId)?.name },
          { key: "date", header: "Date", render: r => `${r.date} ${r.time}` },
          { key: "track", header: "Track" },
          { key: "distance", header: "Distance", render: r => `${r.distance}m` },
          { key: "eligibility", header: "Accepted Horses", render: r => (
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>Age <span className="text-foreground font-medium">{r.eligibility.minAge}-{r.eligibility.maxAge}</span> · Weight <span className="text-foreground font-medium">{r.eligibility.minWeight}-{r.eligibility.maxWeight}kg</span></div>
              <div>Breeds: <span className="text-foreground font-medium">{r.eligibility.allowedBreeds.join(", ")}</span></div>
            </div>
          )},
          { key: "prize", header: "Top Prize", render: r => <span className="font-semibold">${r.prizes[0]?.money.toLocaleString()}</span> },
          { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
          { key: "actions", header: "Actions", render: r => (
            <Button onClick={() => { setSelectedRaceId(r.id); setSelectedHorseId(null); setBackupJockeyId(""); setOpen(true); }}>Register</Button>
          )},
        ]}
        rows={openRaces}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={selectedRace ? `Register for ${selectedRace.id} — ${selectedRace.track}` : "Register"}
        onConfirm={canSubmit ? submit : undefined}
        confirmLabel="Submit Registration"
      >
        {selectedRace && (
          <div className="space-y-4 text-sm">
            <div className="bg-muted/40 border border-border rounded-md p-3 text-xs">
              <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> Eligibility criteria</div>
              <ul className="grid grid-cols-2 gap-y-1 text-muted-foreground">
                <li>Age: <span className="text-foreground font-medium">{selectedRace.eligibility.minAge}–{selectedRace.eligibility.maxAge} yrs</span></li>
                <li>Weight: <span className="text-foreground font-medium">{selectedRace.eligibility.minWeight}–{selectedRace.eligibility.maxWeight} kg</span></li>
                <li className="col-span-2">Breeds: <span className="text-foreground font-medium">{selectedRace.eligibility.allowedBreeds.join(", ")}</span></li>
              </ul>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Select Horse</label>
              <div className="mt-2 space-y-1.5 max-h-56 overflow-auto pr-1">
                {eligibleList.length === 0 && <div className="text-xs text-muted-foreground">No horses in your stable yet.</div>}
                {eligibleList.map(({ horse, check }) => (
                  <label key={horse.id} className={`flex items-start gap-2 p-2 rounded-md border ${check.ok ? "border-border hover:bg-muted/40 cursor-pointer" : "border-border bg-muted/20 opacity-70"} ${selectedHorseId === horse.id ? "ring-2 ring-primary" : ""}`}>
                    <input type="radio" name="horse" disabled={!check.ok}
                      checked={selectedHorseId === horse.id}
                      onChange={() => setSelectedHorseId(horse.id)} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {check.ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-danger" />}
                        <span className="font-medium text-foreground">{horse.name}</span>
                        <span className="text-xs text-muted-foreground">· {horse.breed} · Age {horse.age} · {horse.weight}kg</span>
                      </div>
                      {!check.ok && <div className="text-xs text-danger ml-6 mt-0.5">{check.reasons.join(" · ")}</div>}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Primary Jockey</label>
                <select className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-card"
                  value={selectedJockeyId} onChange={e => setSelectedJockeyId(e.target.value)}>
                  {jockeys.filter(j => j.status === "Active").map(j =>
                    <option key={j.id} value={j.id}>{j.name} (#{j.licenseNo} · Rank {j.ranking})</option>
                  )}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Backup Jockey (nếu nài chính ốm)</label>
                <select className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-card"
                  value={backupJockeyId} onChange={e => setBackupJockeyId(e.target.value)}>
                  <option value="">— None —</option>
                  {jockeys.filter(j => j.status === "Active" && j.id !== selectedJockeyId).map(j =>
                    <option key={j.id} value={j.id}>{j.name} (Rank {j.ranking})</option>
                  )}
                </select>
              </div>
            </div>

            {duplicate && (
              <div className="flex items-start gap-2 text-xs rounded-md px-3 py-2 border bg-danger/10 border-danger/30">
                <ShieldAlert className="h-3.5 w-3.5 mt-0.5 text-danger" />
                <span className="text-foreground">Ngựa này đã được đăng ký cho race này — không thể đăng ký trùng.</span>
              </div>
            )}

            {constraintIssues.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground">Cảnh báo ràng buộc (không chặn nộp, Admin sẽ xét duyệt):</div>
                {constraintIssues.map((i, idx) => (
                  <div key={idx} className={`flex items-start gap-2 text-xs rounded-md px-3 py-2 border ${i.level === "error" ? "bg-danger/10 border-danger/30" : "bg-warning/10 border-warning/30"}`}>
                    {i.level === "error" ? <ShieldAlert className="h-3.5 w-3.5 mt-0.5 text-danger" /> : <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-warning" />}
                    <span className="text-foreground">{i.message}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Đăng ký nên hoàn tất ≥ 5 ngày trước race day. Ngựa cần nghỉ tối thiểu 6 ngày giữa các trận. Nài ngựa không quá 3 con/ngày.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
