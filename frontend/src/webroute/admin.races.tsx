import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { FormModal, ConfirmDialog, DetailModal, type Field } from "@/components/common/FormModal";
import { TableToolbar } from "@/components/common/TableToolbar";
import { usePersistentCollection } from "@/hooks/usePersistentCollection";
import { races as seed, tournaments, getTournament, registrations, refereeAssignments, getJockey, getReferee, type Race } from "@/data/mockData";
import { auditLog } from "@/lib/auditLog";
import { saveRace } from "@/lib/mockApi";
import { Plus, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/races")({ component: RaceManagement });

type RaceForm = {
  id: string; tournamentId: string; round: number; date: string; time: string;
  track: string; distance: number; lanes: number; status: Race["status"];
  minAge: number; maxAge: number; minWeight: number; maxWeight: number; allowedBreeds: string;
  p1_money: number; p1_trophy: string;
  p2_money: number; p2_trophy: string;
  p3_money: number; p3_trophy: string;
};

const fields: Field[] = [
  { name: "id", label: "Race ID", required: true },
  { name: "tournamentId", label: "Tournament", type: "select", required: true, options: tournaments.map(t => ({ label: t.name, value: t.id })) },
  { name: "round", label: "Round", type: "number", required: true },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "time", label: "Time", placeholder: "14:00", required: true },
  { name: "track", label: "Track", required: true },
  { name: "distance", label: "Distance (m)", type: "number", required: true },
  { name: "lanes", label: "Lanes", type: "number", required: true },
  { name: "status", label: "Status", type: "select", required: true, options: ["Scheduled", "Ongoing", "Completed", "Cancelled"].map(s => ({ label: s, value: s })) },
  { name: "minAge", label: "Min age", type: "number" },
  { name: "maxAge", label: "Max age", type: "number" },
  { name: "minWeight", label: "Min weight (kg)", type: "number" },
  { name: "maxWeight", label: "Max weight (kg)", type: "number" },
  { name: "allowedBreeds", label: "Allowed breeds", type: "tags", full: true, placeholder: "Thoroughbred, Arabian" },
  { name: "p1_money", label: "1st prize ($)", type: "number", required: true },
  { name: "p1_trophy", label: "1st trophy", required: true, placeholder: "Gold" },
  { name: "p2_money", label: "2nd prize ($)", type: "number", required: true },
  { name: "p2_trophy", label: "2nd trophy", required: true, placeholder: "Silver" },
  { name: "p3_money", label: "3rd prize ($)", type: "number", required: true },
  { name: "p3_trophy", label: "3rd trophy", required: true, placeholder: "Bronze" },
];

function toForm(r: Race): RaceForm {
  return {
    id: r.id, tournamentId: r.tournamentId, round: r.round, date: r.date, time: r.time,
    track: r.track, distance: r.distance, lanes: r.lanes, status: r.status,
    minAge: r.eligibility.minAge, maxAge: r.eligibility.maxAge,
    minWeight: r.eligibility.minWeight, maxWeight: r.eligibility.maxWeight,
    allowedBreeds: r.eligibility.allowedBreeds.join(", "),
    p1_money: r.prizes[0]?.money ?? 0, p1_trophy: r.prizes[0]?.trophy ?? "Gold",
    p2_money: r.prizes[1]?.money ?? 0, p2_trophy: r.prizes[1]?.trophy ?? "Silver",
    p3_money: r.prizes[2]?.money ?? 0, p3_trophy: r.prizes[2]?.trophy ?? "Bronze",
  };
}

function fromForm(f: RaceForm, prev?: Race): Race {
  return {
    id: f.id, tournamentId: f.tournamentId, round: Number(f.round), date: f.date, time: f.time,
    track: f.track, distance: Number(f.distance), lanes: Number(f.lanes), status: f.status,
    eligibility: {
      minAge: Number(f.minAge) || 0, maxAge: Number(f.maxAge) || 0,
      minWeight: Number(f.minWeight) || 0, maxWeight: Number(f.maxWeight) || 0,
      allowedBreeds: (f.allowedBreeds || "").split(",").map(s => s.trim()).filter(Boolean),
      requiresValidHealthCert: prev?.eligibility.requiresValidHealthCert ?? true,
    },
    prizes: [
      { rank: 1, money: Number(f.p1_money) || 0, trophy: f.p1_trophy || "Gold" },
      { rank: 2, money: Number(f.p2_money) || 0, trophy: f.p2_trophy || "Silver" },
      { rank: 3, money: Number(f.p3_money) || 0, trophy: f.p3_trophy || "Bronze" },
    ],
  };
}

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return (h || 0) * 60 + (m || 0); };

function RaceManagement() {
  const [rows, setRows, loading] = usePersistentCollection<Race>("admin:races", seed);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Race | null>(null);
  const [viewing, setViewing] = useState<Race | null>(null);
  const [deleting, setDeleting] = useState<Race | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  const detectConflict = (race: Race, ignoreId?: string): string | null => {
    const sameSlot = rows.find(r => r.id !== ignoreId && r.date === race.date && r.time === race.time && r.track === race.track);
    if (sameSlot) return `Track conflict: ${sameSlot.id} already booked on ${race.date} ${race.time} at ${race.track}`;
    const sameTrackClose = rows.find(r => r.id !== ignoreId && r.date === race.date && r.track === race.track && Math.abs(toMin(r.time) - toMin(race.time)) < 30);
    if (sameTrackClose) return `Recovery gap conflict: less than 30 min from ${sameTrackClose.id} on same track (${sameTrackClose.time} → ${race.time})`;
    const sameDayRaceIds = rows.filter(r => r.id !== ignoreId && r.date === race.date).map(r => r.id);
    const thisJockeys = registrations.filter(rg => rg.raceId === race.id && rg.status !== "Rejected").map(rg => rg.jockeyId);
    for (const jId of thisJockeys) {
      const clash = registrations.find(rg => rg.jockeyId === jId && rg.raceId !== race.id && sameDayRaceIds.includes(rg.raceId) && rg.status !== "Rejected");
      if (clash) return `Jockey conflict: ${getJockey(jId)?.name} already racing on ${race.date} in ${clash.raceId}`;
    }
    const thisRefs = refereeAssignments.filter(a => a.raceId === race.id).map(a => a.refereeId);
    for (const rId of thisRefs) {
      const clash = refereeAssignments.find(a => a.refereeId === rId && a.raceId !== race.id && sameDayRaceIds.includes(a.raceId));
      if (clash) {
        const other = rows.find(r => r.id === clash.raceId);
        if (other && Math.abs(toMin(other.time) - toMin(race.time)) < 90)
          return `Referee conflict: ${getReferee(rId)?.name} also assigned to ${clash.raceId} at ${other.time}`;
      }
    }
    return null;
  };

  const upsert = async (v: RaceForm) => {
    const prev = rows.find(r => r.id === v.id);
    const race = fromForm(v, prev);
    const c = detectConflict(race, prev?.id);
    if (c) {
      setConflict(c);
      toast.error("Cannot save race", { description: c });
      return;
    }
    await saveRace(
      { id: race.id, tournamentId: race.tournamentId },
      { existing: rows, tournamentIds: tournaments.map(t => t.id), editingId: prev?.id }
    );
    setRows(r => prev ? r.map(x => x.id === race.id ? race : x) : [...r, race]);
    auditLog.add({ actor: "System Admin", action: prev ? "EDIT_RACE" : "CREATE_RACE", target: race.id, details: `${race.track} • ${race.date} ${race.time}` });
    setQ(""); setTFilter(""); setSFilter("");
    setCreating(false); setEditing(null); setConflict(null);
    toast.success(prev ? "Race updated" : "Race created", { description: `${race.id} • ${race.track} • ${race.date} ${race.time}` });
  };
  const remove = (id: string) => {
    setRows(r => r.filter(x => x.id !== id));
    auditLog.add({ actor: "System Admin", action: "DELETE_RACE", target: id });
    setDeleting(null);
    toast.success("Race deleted", { description: id });
  };

  const [q, setQ] = useState("");
  const [tFilter, setTFilter] = useState("");
  const [sFilter, setSFilter] = useState("");
  const filtered = useMemo(() => rows.filter(r => {
    const m = q.trim().toLowerCase();
    if (m && !`${r.id} ${r.track}`.toLowerCase().includes(m)) return false;
    if (tFilter && r.tournamentId !== tFilter) return false;
    if (sFilter && r.status !== sFilter) return false;
    return true;
  }), [rows, q, tFilter, sFilter]);

  return (
    <div>
      <PageHeader
        title="Race Management"
        subtitle="Create races and assign them to tournaments"
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New Race</Button>}
      />
      {conflict && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-warning bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-warning" />
          <div className="flex-1">
            <div className="font-semibold text-warning">Scheduling conflict detected</div>
            <div className="text-foreground/80">{conflict}</div>
          </div>
          <button onClick={() => setConflict(null)} className="text-xs underline">Dismiss</button>
        </div>
      )}
      <TableToolbar
        search={q} onSearch={setQ} searchPlaceholder="Search by race ID or track…"
        filters={[
          { key: "t", label: "Tournaments", value: tFilter, onChange: setTFilter, options: tournaments.map(t => ({ label: t.name, value: t.id })) },
          { key: "s", label: "Statuses", value: sFilter, onChange: setSFilter, options: ["Scheduled","Ongoing","Completed","Cancelled"].map(s => ({ label: s, value: s })) },
        ]}
      />
      <DataTable
        columns={[
          { key: "id", header: "Race ID" },
          { key: "tournament", header: "Tournament", render: r => getTournament(r.tournamentId)?.name ?? "—" },
          { key: "round", header: "Round" },
          { key: "date", header: "Date", render: r => `${r.date} ${r.time}` },
          { key: "track", header: "Track" },
          { key: "distance", header: "Distance", render: r => `${r.distance}m` },
          { key: "lanes", header: "Lanes" },
          { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
          { key: "actions", header: "Actions", render: r => (
            <div className="flex gap-2">
              <Link to="/admin/race-control/$raceId" params={{ raceId: r.id }}><Button variant="primary">Race Control</Button></Link>
              <Button variant="secondary" onClick={() => setViewing(r)}>View</Button>
              <Button variant="ghost" onClick={() => setEditing(r)}>Edit</Button>
              <Button variant="danger" onClick={() => setDeleting(r)}>Delete</Button>
            </div>
          )},
        ]}
        rows={filtered}
        empty={rows.length === 0 ? "No races yet" : "No matches for current filters"}
        loading={loading}
      />

      <FormModal<RaceForm>
        open={creating || !!editing}
        title={editing ? "Edit Race" : "Create Race"}
        fields={fields}
        initial={editing ? toForm(editing) : { id: `R${String(rows.length + 1).padStart(3, "0")}`, status: "Scheduled", lanes: 8, p1_money: 10000, p1_trophy: "Gold", p2_money: 5000, p2_trophy: "Silver", p3_money: 2500, p3_trophy: "Bronze" } as any}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={upsert}
        validate={(v) => {
          const e: Record<string, string> = {};
          const minA = Number(v.minAge), maxA = Number(v.maxAge);
          const minW = Number(v.minWeight), maxW = Number(v.maxWeight);

          if (!v.id || !/^R\d{3,}$/.test(String(v.id))) e.id = "Race ID must look like R001";
          if (!editing && rows.some(r => r.id === v.id)) e.id = "Race ID already exists";
          if (!v.tournamentId) e.tournamentId = "Please select a tournament";

          const t = tournaments.find(x => x.id === v.tournamentId);
          if (t && v.date) {
            if (v.date < t.startDate) e.date = `Date must be on/after tournament start (${t.startDate})`;
            else if (v.date > t.endDate) e.date = `Date must be on/before tournament end (${t.endDate})`;
          }

          if (Number(v.round) < 1) e.round = "Round must be ≥ 1";
          if (Number(v.distance) <= 0) e.distance = "Distance must be > 0";
          if (Number(v.lanes) < 2) e.lanes = "Lanes must be ≥ 2";
          if (!v.time) {
            e.time = "Time is required";
          } else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v.time)) {
            e.time = "Time must be HH:MM (24h), e.g. 09:30 or 14:00";
          }
          if (!v.date) {
            e.date = e.date || "Date is required";
          } else if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date)) {
            e.date = "Date must be YYYY-MM-DD";
          }
          if (!e.time && !e.date && v.tournamentId) {
            const dup = rows.find(r =>
              r.id !== (editing?.id ?? "") &&
              r.tournamentId === v.tournamentId &&
              r.date === v.date &&
              r.time === v.time
            );
            if (dup) e.time = `Duplicate slot: ${dup.id} is already scheduled at ${v.date} ${v.time} in this tournament`;
          }

          if (minA < 0) e.minAge = "Min age cannot be negative";
          if (maxA < 0) e.maxAge = "Max age cannot be negative";
          if (minA && maxA && minA > maxA) e.maxAge = `Max age (${maxA}) must be ≥ min age (${minA})`;

          if (minW < 0) e.minWeight = "Min weight cannot be negative";
          if (maxW < 0) e.maxWeight = "Max weight cannot be negative";
          if (minW && maxW && minW > maxW) e.maxWeight = `Max weight (${maxW}kg) must be ≥ min weight (${minW}kg)`;

          const breeds = (v.allowedBreeds || "").split(",").map(s => s.trim()).filter(Boolean);
          if (!breeds.length) e.allowedBreeds = "Allowed breeds cannot be empty (e.g. Thoroughbred, Arabian)";
          else {
            const seen = new Set<string>();
            const dupes = new Set<string>();
            for (const b of breeds) {
              const lower = b.toLowerCase();
              if (seen.has(lower)) dupes.add(b);
              else seen.add(lower);
            }
            if (dupes.size) e.allowedBreeds = `Duplicate breeds (case-insensitive): ${Array.from(dupes).join(", ")}`;
          }

          const p1 = Number(v.p1_money), p2 = Number(v.p2_money), p3 = Number(v.p3_money);
          if (!(p1 >= 0)) e.p1_money = "1st prize must be ≥ 0";
          if (!(p2 >= 0)) e.p2_money = "2nd prize must be ≥ 0";
          if (!(p3 >= 0)) e.p3_money = "3rd prize must be ≥ 0";
          if (!e.p1_money && !e.p2_money && !e.p3_money && !(p1 >= p2 && p2 >= p3)) {
            e.p1_money = "Order must be: 1st ≥ 2nd ≥ 3rd";
          }
          if (!String(v.p1_trophy || "").trim()) e.p1_trophy = "1st trophy is required";
          if (!String(v.p2_trophy || "").trim()) e.p2_trophy = "2nd trophy is required";
          if (!String(v.p3_trophy || "").trim()) e.p3_trophy = "3rd trophy is required";

          return Object.keys(e).length ? e : null;
        }}
      />

      <DetailModal
        open={!!viewing}
        title={viewing ? `${viewing.id} — ${viewing.track}` : ""}
        items={viewing ? [
          { label: "Tournament", value: getTournament(viewing.tournamentId)?.name },
          { label: "Round", value: viewing.round },
          { label: "When", value: `${viewing.date} ${viewing.time}` },
          { label: "Distance", value: `${viewing.distance} m` },
          { label: "Lanes", value: viewing.lanes },
          { label: "Status", value: <StatusBadge status={viewing.status} /> },
          { label: "Age range", value: `${viewing.eligibility.minAge}–${viewing.eligibility.maxAge}` },
          { label: "Weight range", value: `${viewing.eligibility.minWeight}–${viewing.eligibility.maxWeight} kg` },
          { label: "Allowed breeds", value: viewing.eligibility.allowedBreeds.join(", ") },
          { label: "Prizes", value: viewing.prizes.map(p => `#${p.rank} $${p.money.toLocaleString()}`).join(" • ") },
        ] : []}
        onClose={() => setViewing(null)}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete race?"
        message={`Remove race ${deleting?.id} permanently?`}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting.id)}
      />
    </div>
  );
}
