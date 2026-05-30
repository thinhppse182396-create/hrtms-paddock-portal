import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { FormModal, ConfirmDialog, type Field } from "@/components/common/FormModal";
import { getHorses, createHorse } from "@/services/horseAPI";
import type { Horse } from "@/data/mock-horses"; 
import { Plus } from "lucide-react";

export const Route = createFileRoute("/owner/my-horses")({ component: MyHorses });

const OWNER_ID = "O001";

const fields: Field[] = [
  { name: "name", label: "Horse name", required: true, full: true },
  { name: "breed", label: "Breed", type: "select", required: true, options: ["Thoroughbred", "Arabian", "Quarter Horse"].map(b => ({ label: b, value: b })) },
  { name: "age", label: "Age", type: "number", required: true },
  { name: "weight", label: "Weight (kg)", type: "number", required: true },
  { name: "color", label: "Color" },
  { name: "trainer", label: "Trainer" },
  { name: "healthCertExpiry", label: "Health cert expiry", type: "date", required: true },
  { name: "status", label: "Status", type: "select", required: true, options: ["Eligible", "Ineligible", "Suspended"].map(s => ({ label: s, value: s })) },
 

];

function MyHorses() {
const [rows, setRows] = useState<Horse[]>([]);
const [loading, setLoading] = useState(true);  
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Horse | null>(null);
const [editing, setEditing] = useState<Horse | null>(null);

  const myHorses = useMemo(() => rows.filter(h => h.ownerId === OWNER_ID), [rows]);

  const nextId = () => {
    const max = rows.reduce((m, h) => Math.max(m, Number(h.id.replace(/\D/g, "")) || 0), 0);
    return `H${String(max + 1).padStart(3, "0")}`;
  };
const updateHorse = (v: any) => {
  if (!editing) return;
  setRows(rs => rs.map(h => h.id === editing.id ? {
    ...h,
    name: v.name,
    breed: v.breed,
    age: Number(v.age),
    weight: Number(v.weight),
    healthCertExpiry: v.healthCertExpiry,
    status: v.status,
    color: v.color || h.color,
    trainer: v.trainer || h.trainer,
  } : h));
  setEditing(null);
  toast.success("Horse updated", { description: v.name });
};
const checkDuplicates = (v: any, ignoreId?: string) => {
  const e: Record<string, string> = {};
  const others = rows.filter(h => h.id !== ignoreId);

  if (v.name && others.some(h => h.name.trim().toLowerCase() === v.name.trim().toLowerCase()))
    e.name = "Horse name already exists";

  if (v.microchipId && others.some(h => h.microchipId === v.microchipId))
    e.microchipId = "Microchip ID already exists";

  return e;
};

  const addHorse = (v: any) => {
    const id = nextId();
    const horse: Horse = {
      id,
      name: v.name,
      breed: v.breed,
      age: Number(v.age),
      weight: Number(v.weight),
      ownerId: OWNER_ID,
      healthCertExpiry: v.healthCertExpiry,
      status: v.status,
      color: v.color || "—",
      trainer: v.trainer || "—",
      sire: "—",
      dam: "—",
      microchipId: `MC-${id}`,
      bio: "Newly registered horse.",
      documents: [
        { type: "Health Certificate", number: `HC-${id}`, issuedBy: "National Equine Vet Board", issuedDate: new Date().toISOString().slice(0, 10), expiryDate: v.healthCertExpiry },
      ],
    };
    setRows(rs => [...rs, horse]);
    setCreating(false);
    toast.success("Horse added", { description: `${horse.name} (${horse.id})` });
  };

  const remove = (h: Horse) => {
    setRows(rs => rs.filter(x => x.id !== h.id));
    setDeleting(null);
    toast.success("Horse removed", { description: h.name });
  };

  return (
    <div>
      <PageHeader
        title="My Horses"
        subtitle="Manage your stable — click View to see profile, papers, and race history"
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Add Horse</Button>}
      />
      <DataTable
        columns={[
          { key: "id", header: "ID" },
          { key: "name", header: "Name", render: r => <span className="font-medium text-foreground">{r.name}</span> },
          { key: "breed", header: "Breed" },
          { key: "age", header: "Age" },
          { key: "weight", header: "Weight (kg)" },
          { key: "docs", header: "Documents", render: r => `${r.documents.length} papers` },
          { key: "healthCertExpiry", header: "Health Cert Expiry" },
          { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
          { key: "actions", header: "Actions", render: r => (
  <div className="flex gap-2">
    <Link to="/owner/horse/$horseId" params={{ horseId: r.id }}>
      <Button variant="secondary">View Profile</Button>
    </Link>
    <Button variant="ghost" onClick={() => setEditing(r)}>Edit</Button>
    <Button variant="danger" onClick={() => setDeleting(r)}>Remove</Button>
  </div>
)},
        ]}
        rows={myHorses}
        loading={loading}
        empty="No horses yet — add your first horse."
      />

     <FormModal
  open={creating}
  title="Add New Horse"
  fields={fields}
  initial={{ status: "Eligible" } as any}
  onClose={() => setCreating(false)}
  onSubmit={addHorse}
  validate={(v: any) => {
    const e = checkDuplicates(v);                             
    if (!v.name?.trim()) e.name = "Name is required";
    if (Number(v.age) < 2 || Number(v.age) > 20) e.age = "Age must be 2–20";
    if (Number(v.weight) < 400 || Number(v.weight) > 600) e.weight = "Weight must be 400–600kg";
    return Object.keys(e).length ? e : null;
  }}
/>
      <FormModal
  open={!!editing}
  title="Edit horse"
  fields={fields}
  initial={editing as any}
  onClose={() => setEditing(null)}
  onSubmit={updateHorse}
  validate={(v: any) => {
    const e = checkDuplicates(v, editing?.id);                
    if (!v.name?.trim()) e.name = "Name is required";
    if (!v.breed) e.breed = "Breed is required";
    if (Number(v.age) < 2 || Number(v.age) > 20) e.age = "Age must be 2–20";
    if (Number(v.weight) < 400 || Number(v.weight) > 600) e.weight = "Weight must be 400–600kg";
    return Object.keys(e).length ? e : null;
  }}
/>


      <ConfirmDialog
        open={!!deleting}
        title="Remove horse?"
        message={`Remove "${deleting?.name}" from your stable?`}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting)}
      />
    </div>
  );
}
