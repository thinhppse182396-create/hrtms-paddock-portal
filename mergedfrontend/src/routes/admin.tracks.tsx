import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";
import { FormModal, ConfirmDialog, type Field } from "@/components/common/FormModal";
import { usePersistentCollection } from "@/hooks/usePersistentCollection";
import { tracks as seed, maxLanesForWidth, type Track } from "@/lib/racing";
import { Info, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/tracks")({ component: TracksPage });

const fields: Field[] = [
  { name: "id", label: "Track ID", required: true, placeholder: "TRK-D" },
  { name: "name", label: "Name", required: true, full: true, placeholder: "Track D — New Oval" },
  { name: "lengthMeters", label: "Length (m)", type: "number", required: true, min: 100 },
  { name: "widthMeters", label: "Width (m)", type: "number", required: true, min: 3 },
  { name: "distances", label: "Distances (m, comma separated)", required: true, full: true, placeholder: "1200, 1400, 1600" },
];

function TracksPage() {
  const [data, setData, loading] = usePersistentCollection<Track>("admin:tracks", seed);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Track | null>(null);
  const [deleting, setDeleting] = useState<Track | null>(null);

  const rows = data.map(t => ({
    ...t,
    maxLanes: maxLanesForWidth(t.widthMeters),
    distList: t.distances.map(d => `${d.meters}m`).join(" • "),
  }));

  const upsert = (v: any) => {
    const meters = String(v.distances)
      .split(",").map((s: string) => Number(s.trim())).filter((n: number) => n > 0);
    const track: Track = {
      id: v.id, name: v.name,
      lengthMeters: Number(v.lengthMeters), widthMeters: Number(v.widthMeters),
      distances: meters.map((m: number) => ({ meters: m, chuteLabel: `${m}m Chute` })),
    };
    const isEdit = !!editing;
    setData(d => isEdit ? d.map(x => x.id === editing!.id ? track : x) : [...d, track]);
    setCreating(false); setEditing(null);
    toast.success(isEdit ? "Track updated" : "Track created", { description: `${track.id} • ${maxLanesForWidth(track.widthMeters)} lanes` });
  };
  const remove = (t: Track) => {
    setData(d => d.filter(x => x.id !== t.id));
    setDeleting(null);
    toast.success("Track deleted", { description: t.id });
  };

  return (
    <div>
      <PageHeader
        title="Tracks"
        subtitle="Quản lý track & chute. Số làn tối đa tính theo công thức Nevada."
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New Track</Button>}
      />
      <div className="mb-4 flex items-start gap-2 rounded-md border border-info/40 bg-info/10 px-4 py-3 text-sm">
        <Info className="h-4 w-4 mt-0.5 text-info" />
        <div className="text-foreground/80">
          Số làn tối đa được tính theo công thức Nevada: <b>maxLanes = floor(width ÷ 1.5)</b>.
          Khi tạo Race, Admin chỉ chọn distance từ danh sách chute vật lý của track và laneCount trong khoảng [2, maxLanes].
        </div>
      </div>
      <DataTable
        loading={loading}
        columns={[
          { key: "id", header: "ID" },
          { key: "name", header: "Name" },
          { key: "lengthMeters", header: "Length", render: r => `${r.lengthMeters} m` },
          { key: "widthMeters",  header: "Width",  render: r => `${r.widthMeters} m` },
          { key: "maxLanes",     header: "Max lanes" },
          { key: "distList",     header: "Available distances (chutes)" },
          { key: "actions", header: "Actions", render: r => (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditing(data.find(t => t.id === r.id)!)}>Edit</Button>
              <Button variant="danger" onClick={() => setDeleting(data.find(t => t.id === r.id)!)}>Delete</Button>
            </div>
          )},
        ]}
        rows={rows}
      />

      <FormModal
        open={creating || !!editing}
        title={editing ? "Edit Track" : "New Track"}
        fields={fields}
        initial={editing ? { ...editing, distances: editing.distances.map(d => d.meters).join(", ") } as any : {} as any}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={upsert}
        validate={(v: any) => {
          const e: Record<string, string> = {};
          if (!editing && data.some(t => t.id === v.id)) e.id = "Track ID already exists";
          if (Number(v.widthMeters) < 3) e.widthMeters = "Width must allow at least 2 lanes (≥ 3m)";
          const meters = String(v.distances).split(",").map((s: string) => Number(s.trim())).filter((n: number) => n > 0);
          if (meters.length === 0) e.distances = "Add at least one valid distance";
          if (meters.some((m: number) => m > Number(v.lengthMeters))) e.distances = "Distance cannot exceed track length";
          return Object.keys(e).length ? e : null;
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete track?"
        message={`Remove ${deleting?.name}? Races referencing it will keep their stored distance.`}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting)}
      />
    </div>
  );
}
