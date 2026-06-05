import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { FormModal, ConfirmDialog, DetailModal, type Field } from "@/components/common/FormModal";
import { TableToolbar } from "@/components/common/TableToolbar";
import { usePersistentCollection } from "@/hooks/usePersistentCollection";
import { tournaments as seed, races } from "@/data/mockData";
import { saveTournament } from "@/lib/mockApi";
import { tracks, trackHasConflict, type TrackReservation } from "@/lib/racing";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/admin/tournaments")({ component: TournamentManagement });

type Tournament = (typeof seed)[number] & { trackId?: string };

const baseFields: Field[] = [
  { name: "id", label: "ID", required: true, placeholder: "T005" },
  { name: "name", label: "Name", required: true, full: true },
  { name: "season", label: "Season", type: "select", required: true, options: ["Spring", "Summer", "Autumn", "Winter"].map(s => ({ label: s, value: s })) },
  { name: "trackId", label: "Track Reservation", type: "select", required: true, options: [] },
  { name: "status", label: "Status", type: "select", required: true, options: ["Draft", "Open", "Closed", "Completed"].map(s => ({ label: s, value: s })) },
  { name: "startDate", label: "Start date", type: "date", required: true },
  { name: "endDate", label: "End date", type: "date", required: true },
];

function TournamentManagement() {
  const [rows, setRows, loading] = usePersistentCollection<Tournament>("admin:tournaments", seed);
  const [trackList] = usePersistentCollection("admin:tracks", tracks);

  const fields: Field[] = useMemo(() => baseFields.map(f =>
    f.name === "trackId"
      ? { ...f, options: trackList.map(t => ({ label: `${t.id} — ${t.name}`, value: t.id })) }
      : f,
  ), [trackList]);

  const [editing, setEditing] = useState<Tournament | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Tournament | null>(null);
  const [deleting, setDeleting] = useState<Tournament | null>(null);

  const [q, setQ] = useState("");
  const [season, setSeason] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => rows.filter(r => {
    const m = q.trim().toLowerCase();
    if (m && !`${r.id} ${r.name}`.toLowerCase().includes(m)) return false;
    if (season && r.season !== season) return false;
    if (status && r.status !== status) return false;
    return true;
  }), [rows, q, season, status]);

  const upsert = async (v: Tournament) => {
    const isEdit = rows.some(x => x.id === v.id);
    await saveTournament({ id: v.id }, { existing: rows, editingId: isEdit ? v.id : undefined });
    setRows(r => isEdit ? r.map(x => x.id === v.id ? v : x) : [...r, v]);
    setQ(""); setSeason(""); setStatus("");
    setCreating(false); setEditing(null);
    toast.success(isEdit ? "Tournament updated" : "Tournament created", { description: `${v.id} — ${v.name}` });
  };
  const remove = (t: Tournament) => {
    setRows(r => r.filter(x => x.id !== t.id));
    setDeleting(null);
    toast.success("Tournament deleted", { description: `${t.id} — ${t.name}` });
  };

  return (
    <div>
      <PageHeader
        title="Tournament Management"
        subtitle="Create and manage racing tournaments"
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New Tournament</Button>}
      />
      <TableToolbar
        search={q} onSearch={setQ} searchPlaceholder="Search by ID or name…"
        filters={[
          { key: "season", label: "Seasons", value: season, onChange: setSeason, options: ["Spring","Summer","Autumn","Winter"].map(s => ({ label: s, value: s })) },
          { key: "status", label: "Statuses", value: status, onChange: setStatus, options: ["Draft","Open","Closed","Completed"].map(s => ({ label: s, value: s })) },
        ]}
      />
      <DataTable
        columns={[
          { key: "id", header: "ID" },
          { key: "name", header: "Name" },
          { key: "season", header: "Season" },
          { key: "trackId", header: "Track", render: r => r.trackId ? <span className="font-mono text-xs">{r.trackId}</span> : <span className="text-xs text-muted-foreground">—</span> },
          { key: "startDate", header: "Start" },
          { key: "endDate", header: "End" },
          { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
          { key: "actions", header: "Actions", render: r => (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setViewing(r)}>View</Button>
              <Button variant="ghost" onClick={() => setEditing(r)}>Edit</Button>
              <Button variant="danger" onClick={() => setDeleting(r)}>Delete</Button>
            </div>
          )},
        ]}
        rows={filtered}
        empty={rows.length === 0 ? "No tournaments yet" : "No matches for current filters"}
        loading={loading}
      />


      <FormModal<Tournament>
        open={creating || !!editing}
        title={editing ? "Edit Tournament" : "Create Tournament"}
        fields={fields}
        initial={editing ?? { id: `T${String(rows.length + 1).padStart(3, "0")}` }}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={upsert}
        validate={(v) => {
          const e: Record<string, string> = {};
          if (v.startDate && v.endDate && v.startDate > v.endDate) {
            e.endDate = "End date must be on or after start date";
          }
          if (!/^T\d{3,}$/.test(String(v.id || ""))) e.id = "ID must look like T001";
          if (!editing && rows.some(x => x.id === v.id)) e.id = "ID already exists";
          if (v.trackId && v.startDate && v.endDate) {
            const others: TrackReservation[] = rows
              .filter(x => x.id !== v.id && x.trackId && x.startDate && x.endDate)
              .map(x => ({ trackId: x.trackId!, start: x.startDate, end: x.endDate }));
            const conflict = trackHasConflict({ trackId: v.trackId, start: v.startDate, end: v.endDate }, others);
            if (conflict) e.trackId = `Track ${v.trackId} đã được đặt từ ${conflict.start} → ${conflict.end} bởi tournament khác.`;
          }
          if (editing && v.startDate && v.endDate) {
            const orphaned = races.filter(r =>
              r.tournamentId === v.id &&
              (r.date < v.startDate || r.date > v.endDate)
            );
            if (orphaned.length > 0) {
              e.endDate = `Cảnh báo: ${orphaned.length} Race đã lên lịch nằm ngoài khoảng ngày mới (${orphaned.map(r => r.id).join(", ")})`;
            }
          }
          return Object.keys(e).length ? e : null;
        }}
      />
      <DetailModal
        open={!!viewing}
        title={viewing?.name ?? ""}
        items={viewing ? [
          { label: "ID", value: viewing.id },
          { label: "Season", value: viewing.season },
          { label: "Track", value: viewing.trackId ?? "—" },
          { label: "Start", value: viewing.startDate },
          { label: "End", value: viewing.endDate },
          { label: "Status", value: <StatusBadge status={viewing.status} /> },
        ] : []}
        onClose={() => setViewing(null)}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete tournament?"
        message={`This will permanently remove "${deleting?.name}".`}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting)}
      />
    </div>
  );
}
