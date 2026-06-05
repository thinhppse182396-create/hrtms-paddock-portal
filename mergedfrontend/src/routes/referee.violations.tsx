import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { FormModal, ConfirmDialog, type Field } from "@/components/common/FormModal";
import { TableToolbar } from "@/components/common/TableToolbar";
import { usePersistentCollection } from "@/hooks/usePersistentCollection";
import { violations as seed, getHorse, getJockey, races, horses, jockeys } from "@/data/mockData";
import { Plus } from "lucide-react";

type Violation = (typeof seed)[number];

const TYPES = ["False Start", "Dangerous Riding", "Lane Interference", "Overuse of Whip", "Invalid Registration", "Other"];
const SEVERITIES = ["Minor", "Major", "Critical"];

const fields: Field[] = [
  { name: "id", label: "ID", required: true, placeholder: "V003" },
  { name: "raceId", label: "Race", type: "select", required: true, options: races.map(r => ({ label: `${r.id} — ${r.track}`, value: r.id })) },
  { name: "horseId", label: "Horse", type: "select", required: true, options: horses.map(h => ({ label: h.name, value: h.id })) },
  { name: "jockeyId", label: "Jockey", type: "select", required: true, options: jockeys.map(j => ({ label: j.name, value: j.id })) },
  { name: "type", label: "Type", type: "select", required: true, options: TYPES.map(t => ({ label: t, value: t })) },
  { name: "severity", label: "Severity", type: "select", required: true, options: SEVERITIES.map(s => ({ label: s, value: s })) },
  { name: "description", label: "Description", type: "textarea", required: true, full: true },
];

export const Route = createFileRoute("/referee/violations")({ component: ViolationManagement });

function ViolationManagement() {
  // Shared key: Admin / Spectator pages reading `referee:violations` get live updates.
  const [rows, setRows, loading] = usePersistentCollection<Violation>("referee:violations", seed);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Violation | null>(null);
  const [deleting, setDeleting] = useState<Violation | null>(null);
  const [q, setQ] = useState("");
  const [raceFilter, setRaceFilter] = useState("");
  const [sev, setSev] = useState("");

  const filtered = useMemo(() => rows.filter(r => {
    const m = q.trim().toLowerCase();
    if (m && !`${r.type} ${r.description} ${getHorse(r.horseId)?.name ?? ""} ${getJockey(r.jockeyId)?.name ?? ""}`.toLowerCase().includes(m)) return false;
    if (raceFilter && r.raceId !== raceFilter) return false;
    if (sev && r.severity !== sev) return false;
    return true;
  }), [rows, q, raceFilter, sev]);

  const upsert = (v: Violation) => {
    const isEdit = !!editing;
    setRows(rs => isEdit ? rs.map(x => x.id === editing!.id ? v : x) : [...rs, v]);
    setQ(""); setRaceFilter(""); setSev("");
    setCreating(false); setEditing(null);
    toast.success(isEdit ? "Violation updated" : "Violation recorded", { description: `${v.id} • ${v.type}` });
  };
  const remove = (v: Violation) => {
    setRows(rs => rs.filter(x => x.id !== v.id));
    setDeleting(null);
    toast.success("Violation deleted", { description: v.id });
  };

  return (
    <div>
      <PageHeader
        title="Violation Management"
        subtitle="Record race violations — đồng bộ real-time sang Admin & Spectator"
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Add Violation</Button>}
      />
      <TableToolbar
        search={q} onSearch={setQ} searchPlaceholder="Search by type, horse, jockey…"
        filters={[
          { key: "race", label: "Races", value: raceFilter, onChange: setRaceFilter, options: races.map(r => ({ label: r.id, value: r.id })) },
          { key: "sev", label: "Severities", value: sev, onChange: setSev, options: SEVERITIES.map(s => ({ label: s, value: s })) },
        ]}
      />
      <DataTable
        columns={[
          { key: "id", header: "ID" },
          { key: "raceId", header: "Race" },
          { key: "horse", header: "Horse", render: r => getHorse(r.horseId)?.name ?? r.horseId },
          { key: "jockey", header: "Jockey", render: r => getJockey(r.jockeyId)?.name ?? r.jockeyId },
          { key: "type", header: "Type" },
          { key: "severity", header: "Severity", render: r => <StatusBadge status={r.severity === "Critical" ? "Rejected" : r.severity === "Major" ? "Pending" : "Submitted"} /> },
          { key: "description", header: "Description" },
          { key: "actions", header: "Actions", render: r => (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditing(r)}>Edit</Button>
              <Button variant="danger" onClick={() => setDeleting(r)}>Delete</Button>
            </div>
          )},
        ]}
        rows={filtered}
        loading={loading}
        empty={rows.length === 0 ? "Chưa có violation nào." : "No matches."}
      />

      <FormModal<Violation>
        open={creating || !!editing}
        title={editing ? "Edit Violation" : "Record Violation"}
        fields={fields}
        initial={editing ?? { id: `V${String(rows.length + 1).padStart(3, "0")}`, severity: "Minor", type: "Other" } as any}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={upsert}
        validate={(v) => {
          const e: Record<string, string> = {};
          if (!editing && rows.some(x => x.id === v.id)) e.id = "ID đã tồn tại";
          if (!String(v.description ?? "").trim()) e.description = "Bắt buộc";
          return Object.keys(e).length ? e : null;
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete violation?"
        message={`Remove violation ${deleting?.id}?`}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting)}
      />
    </div>
  );
}
