import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { useDatabaseCollection } from "@/hooks/useDatabaseCollection";
import { jockeys, jockeyInvitations as inviteSeed, horses as horseSeed, races, registrations, getHorse, getRace, type Horse } from "@/data/databaseData";
import { ArrowDownUp } from "lucide-react";
import { parseLocalDateTime } from "@/lib/dateTime";
import { useAuth } from "@/auth/AuthContext";
import { createJockeyInvitations } from "@/lib/backendApi";

export const Route = createFileRoute("/owner/jockey-invitations")({ component: JockeyInvitation });

type Invite = (typeof inviteSeed)[number] & { note?: string };
type SortKey = "ranking" | "weight" | "name";

function JockeyInvitation() {
  const [allInvites] = useDatabaseCollection<Invite>("owner:jockeyInvitations", inviteSeed as Invite[]);
  const { currentUser } = useAuth();
  const ownerId = currentUser?.accountId ?? "";
  const [allHorses] = useDatabaseCollection<Horse>("owner:horses", horseSeed);
  const [sortKey, setSortKey] = useState<SortKey>("ranking");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("Active");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [targetJockey, setTargetJockey] = useState<typeof jockeys[number] | null>(null);
  const [selectedHorse, setSelectedHorse] = useState("");
  const [selectedRace, setSelectedRace] = useState("");
  const [note, setNote] = useState("");

  const invites = useMemo(() => allInvites.filter(i => i.ownerId === ownerId), [allInvites, ownerId]);
  const myHorses = useMemo(() => allHorses.filter(h => h.ownerId === ownerId && h.status === "Eligible"), [allHorses, ownerId]);
  const upcomingRaces = races.filter(r => {
    const start = parseLocalDateTime(r.date, r.time);
    return r.status === "Scheduled" && !!start && start.getTime() - Date.now() > 24 * 3_600_000;
  });

  const sortedJockeys = useMemo(() => {
    const filtered = jockeys.filter(j => statusFilter === "All" || j.status === statusFilter);
    return [...filtered].sort((a, b) => {
      if (sortKey === "ranking") return a.ranking - b.ranking;
      if (sortKey === "weight") return a.weight - b.weight;
      return a.name.localeCompare(b.name);
    });
  }, [sortKey, statusFilter]);

  const openInvite = (j: typeof jockeys[number]) => {
    setTargetJockey(j);
    setSelectedHorse(myHorses[0]?.id ?? "");
    setSelectedRace(upcomingRaces[0]?.id ?? "");
    setNote("");
    setInviteOpen(true);
  };

  const sendInvite = async () => {
    if (!targetJockey || !selectedHorse || !selectedRace) return;
    const registration = registrations.find(item =>
      item.ownerId === ownerId &&
      item.horseId === selectedHorse &&
      item.raceId === selectedRace &&
      item.status === "Approved" &&
      (item.jockeyId === targetJockey.id || item.backupJockeyId === targetJockey.id),
    );
    if (!registration) {
      toast.error("Create an approved registration first", {
        description: "The backend creates invitations for the primary and backup jockeys on an approved entry.",
      });
      return;
    }
    await createJockeyInvitations(registration.id);
    setInviteOpen(false);
    toast.success("Invitation sent", { description: `${targetJockey.name}` });
  };


  return (
    <div>
      <PageHeader title="Jockey Invitations" subtitle="Sort jockeys, pick a horse and race, then send invitation" />

      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowDownUp className="h-4 w-4" /> Sort by
        </div>
        <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} className="px-3 py-1.5 border border-input rounded-md bg-card text-sm">
          <option value="ranking">Ranking (best first)</option>
          <option value="weight">Weight (lightest first)</option>
          <option value="name">Name (A-Z)</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-3 py-1.5 border border-input rounded-md bg-card text-sm">
          <option value="All">All status</option>
          <option value="Active">Active only</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Available Jockeys</h2>
      <div className="mb-6">
        <DataTable
          columns={[
            { key: "name", header: "Name" },
            { key: "licenseNo", header: "License No" },
            { key: "weight", header: "Weight (kg)" },
            { key: "ranking", header: "Ranking", render: j => <span className="font-semibold">#{j.ranking}</span> },
            { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
            { key: "actions", header: "Actions", render: j => (
              <Button disabled={j.status !== "Active"} onClick={() => openInvite(j)}>Invite</Button>
            )},
          ]}
          rows={sortedJockeys}
        />
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Sent Invitations</h2>
      <DataTable
        columns={[
          { key: "id", header: "ID" },
          { key: "jockey", header: "Jockey", render: r => jockeys.find(j => j.id === r.jockeyId)?.name },
          { key: "horse", header: "Horse", render: r => getHorse(r.horseId)?.name },
          { key: "race", header: "Race", render: r => { const race = getRace(r.raceId); return race ? `${race.id} · ${race.track} · ${race.date}` : r.raceId; } },
          { key: "note", header: "Note", render: r => <span className="text-xs text-muted-foreground">{(r as any).note ?? "—"}</span> },
          { key: "sentAt", header: "Sent" },
          { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
        ]}
        rows={invites}
      />

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title={targetJockey ? `Invite ${targetJockey.name}` : "Invite jockey"} onConfirm={() => void sendInvite()} confirmLabel="Send Invitation">
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs text-muted-foreground">Horse</label>
            <select value={selectedHorse} onChange={e => setSelectedHorse(e.target.value)} className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-card">
              {myHorses.map(h => <option key={h.id} value={h.id}>{h.name} · {h.breed}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Race</label>
            <select value={selectedRace} onChange={e => setSelectedRace(e.target.value)} className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-card">
              {upcomingRaces.map(r => <option key={r.id} value={r.id}>{r.id} · {r.track} · {r.date} {r.time}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Message to jockey</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-card" placeholder="Briefly tell the jockey about the horse, target finish, prize, etc." />
          </div>
        </div>
      </Modal>
    </div>
  );
}
