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
import { referees as seedRefs, races, refereeAssignments as seedA, getReferee } from "@/data/mockData";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/admin/referees")({ component: RefereeAssignment });

type Referee = (typeof seedRefs)[number];
type Assignment = (typeof seedA)[number];

const refFields: Field[] = [
  { name: "id", label: "ID", required: true },
  { name: "name", label: "Name", required: true, full: true },
  { name: "licenseNo", label: "License No", required: true },
  { name: "experience", label: "Experience", placeholder: "5 years" },
  { name: "status", label: "Status", type: "select", required: true, options: ["Active", "Inactive"].map(s => ({ label: s, value: s })) },
];

function RefereeAssignment() {
  const [refs, setRefs, refsLoading] = usePersistentCollection<Referee>("admin:referees", seedRefs);
  const [assigns, setAssigns, assignsLoading] = usePersistentCollection<Assignment>("admin:refereeAssignments", seedA);
  const loading = refsLoading || assignsLoading;

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Referee | null>(null);
  const [deleting, setDeleting] = useState<Referee | null>(null);
  const [assignRace, setAssignRace] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const filteredRefs = useMemo(() => refs.filter(r => {
    const m = q.trim().toLowerCase();
    if (m && !`${r.id} ${r.name} ${r.licenseNo}`.toLowerCase().includes(m)) return false;
    if (status && r.status !== status) return false;
    return true;
  }), [refs, q, status]);

  const [rq, setRQ] = useState("");
  const [rStatus, setRStatus] = useState("");
  const filteredRaces = useMemo(() => races.filter(r => {
    const m = rq.trim().toLowerCase();
    if (m && !`${r.id} ${r.track}`.toLowerCase().includes(m)) return false;
    if (rStatus && r.status !== rStatus) return false;
    return true;
  }), [rq, rStatus]);

  const upsertRef = (v: Referee) => {
    const isEdit = refs.some(x => x.id === v.id);
    setRefs(r => isEdit ? r.map(x => x.id === v.id ? v : x) : [...r, v]);
    setQ(""); setStatus("");
    setCreating(false); setEditing(null);
    toast.success(isEdit ? "Referee updated" : "Referee created", { description: `${v.name} • ${v.licenseNo}` });
  };
  const removeRef = (r: Referee) => {
    setRefs(d => d.filter(x => x.id !== r.id));
    setAssigns(a => a.filter(x => x.refereeId !== r.id));
    setDeleting(null);
    toast.success("Referee deleted", { description: `${r.name} • assignments cleared` });
  };
  const assignFields: Field[] = [
    { name: "refereeId", label: "Referee", type: "select", required: true, full: true, options: refs.filter(r => r.status === "Active").map(r => ({ label: `${r.name} (${r.licenseNo})`, value: r.id })) },
  ];

  return (
    <div>
      <PageHeader title="Referee Assignment" subtitle="Assign referees to races"
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New Referee</Button>} />

      <h2 className="text-sm font-semibold text-foreground mb-3">Active Referees</h2>
      <TableToolbar
        search={q} onSearch={setQ} searchPlaceholder="Search by name or license…"
        filters={[
          { key: "status", label: "Statuses", value: status, onChange: setStatus, options: ["Active","Inactive"].map(s => ({ label: s, value: s })) },
        ]}
      />
      <div className="mb-6">
        <DataTable
          columns={[
            { key: "id", header: "ID" },
            { key: "name", header: "Name" },
            { key: "licenseNo", header: "License No" },
            { key: "experience", header: "Experience" },
            { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
            { key: "actions", header: "Actions", render: r => (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setEditing(r)}>Edit</Button>
                <Button variant="danger" onClick={() => setDeleting(r)}>Delete</Button>
              </div>
            )},
          ]}
          rows={filteredRefs}
          empty={refs.length === 0 ? "No referees yet" : "No matches"}
          loading={loading}
        />
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Race Assignments</h2>
      <TableToolbar
        search={rq} onSearch={setRQ} searchPlaceholder="Search races by ID or track…"
        filters={[
          { key: "status", label: "Statuses", value: rStatus, onChange: setRStatus, options: ["Scheduled","Ongoing","Completed","Cancelled"].map(s => ({ label: s, value: s })) },
        ]}
      />
      <DataTable
        columns={[
          { key: "id", header: "Race" },
          { key: "date", header: "Date" },
          { key: "track", header: "Track" },
          { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
          { key: "referee", header: "Referee", render: r => {
            const a = assigns.find(x => x.raceId === r.id);
            return a ? (refs.find(ref => ref.id === a.refereeId)?.name ?? getReferee(a.refereeId)?.name) : <span className="text-warning">Unassigned</span>;
          }},
          { key: "actions", header: "Actions", render: r => (
            <div className="flex gap-2">
              <Button onClick={() => setAssignRace(r.id)}>{assigns.some(x => x.raceId === r.id) ? "Reassign" : "Assign"}</Button>
              {assigns.some(x => x.raceId === r.id) && (
                <Button variant="ghost" onClick={() => { setAssigns(a => a.filter(x => x.raceId !== r.id)); toast.success("Referee unassigned", { description: r.id }); }}>Unassign</Button>
              )}
            </div>
          )},
        ]}
        rows={filteredRaces}
        empty="No matches"
        loading={loading}
      />

      <FormModal<Referee>
        open={creating || !!editing}
        title={editing ? "Edit Referee" : "New Referee"}
        fields={refFields}
        initial={editing ?? { id: `RF${String(refs.length + 1).padStart(3, "0")}`, status: "Active" } as any}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={upsertRef}
        validate={(v) => {
          const e: Record<string, string> = {};
          if (!editing && refs.some(x => x.id === v.id)) e.id = "ID already exists";
          if (refs.some(x => x.licenseNo === v.licenseNo && x.id !== v.id)) e.licenseNo = "License No already used";
          return Object.keys(e).length ? e : null;
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete referee?"
        message={`Remove ${deleting?.name}? Assignments will be cleared.`}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && removeRef(deleting)}
      />
      <FormModal<{ refereeId: string }>
        open={!!assignRace}
        title={`Assign Referee — ${assignRace}`}
        fields={assignFields}
        onClose={() => setAssignRace(null)}
        onSubmit={(v) => {
          if (!assignRace) return;
          setAssigns(a => {
            const filtered = a.filter(x => x.raceId !== assignRace);
            return [...filtered, { raceId: assignRace, refereeId: v.refereeId }];
          });
          toast.success("Referee assigned", { description: `${refs.find(r => r.id === v.refereeId)?.name ?? getReferee(v.refereeId)?.name} → ${assignRace}` });
          setAssignRace(null);
        }}
        submitLabel="Assign"
      />
    </div>
  );
}
