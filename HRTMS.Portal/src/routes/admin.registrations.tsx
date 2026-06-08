import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { FormModal, ConfirmDialog, DetailModal, type Field } from "@/components/common/FormModal";
import { TableToolbar } from "@/components/common/TableToolbar";
import { useDatabaseCollection } from "@/hooks/useDatabaseCollection";
import { registrations as seed, getHorse, getJockey, getOwner, horses, jockeys, owners, races } from "@/data/databaseData";
import { Plus } from "lucide-react";
import { deleteRegistration, isBackendEnabled, syncRegistration, updateRegistrationStatus } from "@/lib/backendApi";
import { isHorseEligibleForRace } from "@/data/databaseData";
import { checkRegistrationDeadline } from "@/lib/racing";
import { toLocalDateString } from "@/lib/dateTime";

export const Route = createFileRoute("/admin/registrations")({ component: RegistrationManagement });

type Reg = (typeof seed)[number] & { reason?: string };

const fields: Field[] = [
  { name: "id", label: "ID", required: true },
  { name: "raceId", label: "Race", type: "select", required: true, options: races.map(r => ({ label: `${r.id} — ${r.track}`, value: r.id })) },
  { name: "horseId", label: "Horse", type: "select", required: true, options: horses.map(h => ({ label: h.name, value: h.id })) },
  { name: "jockeyId", label: "Jockey", type: "select", required: true, options: jockeys.map(j => ({ label: j.name, value: j.id })) },
  { name: "ownerId", label: "Owner", type: "select", required: true, options: owners.map(o => ({ label: o.name, value: o.id })) },
  { name: "submittedAt", label: "Submitted", type: "date", required: true },
  { name: "status", label: "Status", type: "select", required: true, options: ["Pending", "Approved", "Rejected", "Cancelled"].map(s => ({ label: s, value: s })) },
  { name: "reason", label: "Note / reason", type: "textarea" },
];

function RegistrationManagement() {
  const [rows, setRows, loading] = useDatabaseCollection<Reg>("admin:registrations", seed as Reg[]);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Reg | null>(null);
  const [viewing, setViewing] = useState<Reg | null>(null);
  const [deleting, setDeleting] = useState<Reg | null>(null);

  const [q, setQ] = useState("");
  const [race, setRace] = useState("");
  const [status, setStatus] = useState("");
  const filtered = useMemo(() => rows.filter(r => {
    const m = q.trim().toLowerCase();
    if (m) {
      const hay = `${r.id} ${r.raceId} ${getHorse(r.horseId)?.name ?? ""} ${getJockey(r.jockeyId)?.name ?? ""} ${getOwner(r.ownerId)?.name ?? ""}`.toLowerCase();
      if (!hay.includes(m)) return false;
    }
    if (race && r.raceId !== race) return false;
    if (status && r.status !== status) return false;
    return true;
  }), [rows, q, race, status]);

  const update = async (id: string, status: string) => {
    if (isBackendEnabled()) {
      try {
        await updateRegistrationStatus(id, status);
      } catch (error: any) {
        toast.error("Cannot update registration", { description: error?.message });
        return;
      }
    }
    setRows(d => d.map(r => r.id === id ? { ...r, status } : r));
    toast.success(`Registration ${status.toLowerCase()}`, { description: id });
  };
  const upsert = async (v: Reg) => {
    const isEdit = rows.some(x => x.id === v.id);
    if (isBackendEnabled()) {
      if (isEdit) {
        await updateRegistrationStatus(v.id, v.status);
      } else {
        await syncRegistration(v);
      }
    }
    setRows(r => isEdit ? r.map(x => x.id === v.id ? v : x) : [...r, v]);
    setQ(""); setRace(""); setStatus("");
    setCreating(false); setEditing(null);
    toast.success(isEdit ? "Registration updated" : "Registration created", { description: `${v.id} • ${v.raceId}` });
  };
  const remove = async (r: Reg) => {
    await deleteRegistration(r.id);
    setRows(d => d.filter(x => x.id !== r.id));
    setDeleting(null);
    toast.success("Registration deleted", { description: r.id });
  };

  return (
    <div>
      <PageHeader title="Registration Management" subtitle="Approve or reject race registrations"
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New Registration</Button>} />
      <TableToolbar
        search={q} onSearch={setQ} searchPlaceholder="Search by ID, horse, jockey or owner…"
        filters={[
          { key: "race", label: "Races", value: race, onChange: setRace, options: races.map(r => ({ label: `${r.id} — ${r.track}`, value: r.id })) },
          { key: "status", label: "Statuses", value: status, onChange: setStatus, options: ["Pending","Approved","Rejected","Cancelled"].map(s => ({ label: s, value: s })) },
        ]}
      />
      <DataTable
        columns={[
          { key: "id", header: "ID" },
          { key: "raceId", header: "Race" },
          { key: "horse", header: "Horse", render: r => getHorse(r.horseId)?.name ?? r.horseId },
          { key: "jockey", header: "Jockey", render: r => getJockey(r.jockeyId)?.name ?? r.jockeyId },
          { key: "owner", header: "Owner", render: r => getOwner(r.ownerId)?.name ?? r.ownerId },
          { key: "submittedAt", header: "Submitted" },
          { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
          { key: "actions", header: "Actions", render: r => (
            <div className="flex flex-wrap gap-2">
              {r.status === "Pending" && (
                <>
                  <Button onClick={() => update(r.id, "Approved")}>Approve</Button>
                  <Button variant="danger" onClick={() => update(r.id, "Rejected")}>Reject</Button>
                </>
              )}
              <Button variant="secondary" onClick={() => setViewing(r)}>View</Button>
              <Button variant="ghost" onClick={() => setEditing(r)}>Edit</Button>
              <Button variant="danger" onClick={() => setDeleting(r)}>Delete</Button>
            </div>
          )},
        ]}
        rows={filtered}
        empty={rows.length === 0 ? "No registrations yet" : "No matches for current filters"}
        loading={loading}
      />

      <FormModal<Reg>
        open={creating || !!editing}
        title={editing ? "Edit Registration" : "New Registration"}
        fields={fields}
        initial={editing ?? { id: isBackendEnabled() ? `RG${Date.now()}` : `RG${String(rows.length + 1).padStart(3, "0")}`, status: "Pending", submittedAt: toLocalDateString() } as any}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={upsert}
        validate={(v) => {
          const e: Record<string, string> = {};
          if (!editing && rows.some(x => x.id === v.id)) e.id = "ID already exists";
          const dup = rows.find(x => x.raceId === v.raceId && x.horseId === v.horseId && x.id !== v.id && x.status !== "Rejected" && x.status !== "Cancelled");
          if (dup) e._form = `Horse already registered in ${v.raceId} (${dup.id})`;
          const selectedRace = races.find(race => race.id === v.raceId);
          if (selectedRace && !editing) {
            if (selectedRace.status !== "Scheduled") e.raceId = "Registration is only available for scheduled races";
            const deadline = checkRegistrationDeadline(selectedRace.date)[0];
            if (deadline) e.raceId = deadline.message;
          }
          const selectedHorse = horses.find(horse => horse.id === v.horseId);
          if (selectedRace && selectedHorse && !editing) {
            const eligibility = isHorseEligibleForRace(selectedHorse, selectedRace);
            if (!eligibility.ok) e.horseId = eligibility.reasons.join("; ");
          }
          return Object.keys(e).length ? e : null;
        }}
      />
      <DetailModal
        open={!!viewing}
        title={viewing ? `Registration ${viewing.id}` : ""}
        items={viewing ? [
          { label: "Race", value: viewing.raceId },
          { label: "Horse", value: getHorse(viewing.horseId)?.name },
          { label: "Jockey", value: getJockey(viewing.jockeyId)?.name },
          { label: "Owner", value: getOwner(viewing.ownerId)?.name },
          { label: "Submitted", value: viewing.submittedAt },
          { label: "Status", value: <StatusBadge status={viewing.status} /> },
          { label: "Note", value: viewing.reason },
        ] : []}
        onClose={() => setViewing(null)}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete registration?"
        message={`Remove registration ${deleting?.id}?`}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && void remove(deleting)}
      />
    </div>
  );
}
