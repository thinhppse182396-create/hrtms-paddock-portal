import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAuth } from "@/auth/AuthContext";
import { jockeys } from "@/data/databaseData";
import { updateJockeyProfile } from "@/lib/backendApi";

export const Route = createFileRoute("/jockey/profile")({ component: JockeyProfile });

interface JockeyProfileData {
  weight: string;
  contact: string;
}

function JockeyProfile() {
  const { currentUser } = useAuth();
  const jockey = jockeys.find(item => item.accountId === currentUser?.accountId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<JockeyProfileData>({ weight: "", contact: "" });

  useEffect(() => {
    if (!jockey) return;
    setDraft({ weight: String(jockey.weight), contact: jockey.contact ?? "" });
  }, [jockey]);

  const save = async () => {
    if (!jockey) return;
    await updateJockeyProfile(jockey.id, { weight: Number(draft.weight), contact: draft.contact });
    setEditing(false);
    toast.success("Profile updated");
  };

  if (!jockey) {
    return <div className="text-sm text-muted-foreground">Jockey profile not found for this account.</div>;
  }

  return (
    <div>
      <PageHeader
        title="Jockey Profile"
        subtitle="Your personal information from the racing database"
        actions={editing
          ? <><Button onClick={() => void save()}>Save</Button><Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button></>
          : <Button onClick={() => setEditing(true)}>Update Profile</Button>}
      />
      <div className="bg-card border border-border rounded-lg p-6 max-w-2xl">
        <dl className="space-y-4 text-sm">
          <Row label="Name" value={currentUser?.name ?? ""} />
          <Row label="License Number" value={<>{jockey.licenseNo} <StatusBadge status="Confirmed" /></>} />
          <Row label="Weight (kg)" value={editing
            ? <input className="px-3 py-1.5 border border-input rounded-md w-32" value={draft.weight} onChange={event => setDraft(value => ({ ...value, weight: event.target.value }))} />
            : jockey.weight} />
          <Row label="Ranking" value={`#${jockey.ranking}`} />
          <Row label="Status" value={<StatusBadge status={jockey.status} />} />
          <Row label="Contact" value={editing
            ? <input className="px-3 py-1.5 border border-input rounded-md w-full max-w-sm" value={draft.contact} onChange={event => setDraft(value => ({ ...value, contact: event.target.value }))} />
            : jockey.contact ?? ""} />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 items-center">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 font-medium flex items-center gap-2">{value}</dd>
    </div>
  );
}
