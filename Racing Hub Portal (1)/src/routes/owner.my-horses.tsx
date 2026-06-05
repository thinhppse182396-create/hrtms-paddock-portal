import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { FormModal, ConfirmDialog, type Field } from "@/components/common/FormModal";
import { useDatabaseCollection } from "@/hooks/useDatabaseCollection";
import { horses as seed, type Horse } from "@/data/databaseData";
import { Plus } from "lucide-react";
import { addLocalDays, toLocalDateString } from "@/lib/dateTime";
import { useAuth } from "@/auth/AuthContext";
import { deleteHorse, syncHorse } from "@/lib/backendApi";

export const Route = createFileRoute("/owner/my-horses")({ component: MyHorses });

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
  const [rows, setRows, loading] = useDatabaseCollection<Horse>("owner:horses", seed);
  const { currentUser } = useAuth();
  const ownerId = currentUser?.accountId ?? "";
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Horse | null>(null);

  const myHorses = useMemo(() => rows.filter(h => h.ownerId === ownerId), [rows, ownerId]);

  const nextId = () => {
    const max = rows.reduce((m, h) => Math.max(m, Number(h.id.replace(/\D/g, "")) || 0), 0);
    return `H${String(max + 1).padStart(3, "0")}`;
  };

  const addHorse = async (v: any) => {
    const id = nextId();
    const horse: Horse = {
      id,
      name: v.name,
      breed: v.breed,
      age: Number(v.age),
      weight: Number(v.weight),
      ownerId,
      healthCertExpiry: v.healthCertExpiry,
      status: v.status,
      color: v.color || "—",
      trainer: v.trainer || "—",
      sire: "—",
      dam: "—",
      microchipId: `MC-${id}`,
      bio: "Newly registered horse.",
      documents: [
        { type: "Health Certificate", number: `HC-${id}`, issuedBy: "National Equine Vet Board", issuedDate: toLocalDateString(), expiryDate: v.healthCertExpiry },
      ],
    };
    await syncHorse(horse);
    setRows(rs => [...rs, horse]);
    setCreating(false);
    toast.success("Horse added", { description: `${horse.name} (${horse.id})` });
  };

  const remove = async (h: Horse) => {
    await deleteHorse(h.id);
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
        initial={{ status: "Eligible", healthCertExpiry: addLocalDays(180) } as any}
        onClose={() => setCreating(false)}
        onSubmit={addHorse}
        validate={(v: any) => {
          const e: Record<string, string> = {};
          if (Number(v.age) < 2 || Number(v.age) > 20) e.age = "Age must be 2–20";
          if (Number(v.weight) < 400 || Number(v.weight) > 600) e.weight = "Weight must be 400–600kg";
          if (v.status === "Eligible" && v.healthCertExpiry < toLocalDateString()) {
            e.healthCertExpiry = "An eligible horse must have a current health certificate";
          }
          return Object.keys(e).length ? e : null;
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Remove horse?"
        message={`Remove "${deleting?.name}" from your stable?`}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && void remove(deleting)}
      />
    </div>
  );
}
