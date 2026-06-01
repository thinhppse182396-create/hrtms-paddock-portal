import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAuth } from "@/auth/AuthContext";

export const Route = createFileRoute("/jockey/profile")({ component: JockeyProfile });

interface JockeyProfileData {
  weight: string;
  contact: string;
}

function JockeyProfile() {
  const { currentUser } = useAuth();
  const storageKey = `jockey:profile:${currentUser?.username ?? "anon"}`;

  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<JockeyProfileData>({ weight: "56", contact: "smith@racing.com" });
  const [draft, setDraft] = useState<JockeyProfileData>(profile);

  // Hydrate from storage once.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as JockeyProfileData;
        setProfile(saved);
        setDraft(saved);
      }
    } catch { /* ignore */ }
  }, [storageKey]);

  const startEdit = () => { setDraft(profile); setEditing(true); };
  const save = () => {
    setProfile(draft);
    try { window.localStorage.setItem(storageKey, JSON.stringify(draft)); } catch { /* ignore */ }
    setEditing(false);
    toast.success("Profile updated");
  };

  return (
    <div>
      <PageHeader
        title="Jockey Profile"
        subtitle="Your personal information"
        actions={
          editing
            ? <><Button onClick={save}>Save</Button><Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button></>
            : <Button onClick={startEdit}>Update Profile</Button>
        }
      />
      <div className="bg-card border border-border rounded-lg p-6 max-w-2xl">
        <dl className="space-y-4 text-sm">
          <div className="grid grid-cols-3 gap-4 items-center">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="col-span-2 font-medium">{currentUser?.name}</dd>
          </div>
          <div className="grid grid-cols-3 gap-4 items-center">
            <dt className="text-muted-foreground">License Number</dt>
            <dd className="col-span-2 font-medium flex items-center gap-2">
              JK-2024-001
              <StatusBadge status="Confirmed" />
              <span className="text-xs text-muted-foreground">(verified, cannot edit)</span>
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-4 items-center">
            <dt className="text-muted-foreground">Weight (kg)</dt>
            <dd className="col-span-2">
              {editing
                ? <input className="px-3 py-1.5 border border-input rounded-md w-32" value={draft.weight} onChange={e => setDraft(d => ({ ...d, weight: e.target.value }))} />
                : <span className="font-medium">{profile.weight}</span>}
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-4 items-center">
            <dt className="text-muted-foreground">Ranking</dt>
            <dd className="col-span-2 font-medium">#3</dd>
          </div>
          <div className="grid grid-cols-3 gap-4 items-center">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="col-span-2"><StatusBadge status="Active" /></dd>
          </div>
          <div className="grid grid-cols-3 gap-4 items-center">
            <dt className="text-muted-foreground">Contact</dt>
            <dd className="col-span-2">
              {editing
                ? <input className="px-3 py-1.5 border border-input rounded-md w-full max-w-sm" value={draft.contact} onChange={e => setDraft(d => ({ ...d, contact: e.target.value }))} />
                : <span className="font-medium">{profile.contact}</span>}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
