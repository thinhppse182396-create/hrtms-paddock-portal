import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { jockeys, jockeyInvitations as initial, getHorse, getOwner, getRace } from "@/data/databaseData";
import { parseLocalDateTime } from "@/lib/dateTime";
import { Eye, CheckCircle2, XCircle, Calendar, MapPin, Trophy, Weight } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { useDatabaseCollection } from "@/hooks/useDatabaseCollection";
import { acceptJockeyInvitation } from "@/lib/backendApi";

export const Route = createFileRoute("/jockey/invitations")({ component: InvitationManagement });

function InvitationManagement() {
  const { currentUser } = useAuth();
  const myJockeyId = jockeys.find(jockey => jockey.accountId === currentUser?.accountId)?.id ?? "";
  const [allInvitations] = useDatabaseCollection("jockey:invitations", initial);
  const data = useMemo(() => allInvitations.filter(i => i.jockeyId === myJockeyId).map(i => {
    if (i.status !== "Waiting") return i;
    const race = getRace(i.raceId);
    if (!race) return i;
    const raceStart = parseLocalDateTime(race.date, race.time || "12:00");
    const hoursUntil = raceStart ? (raceStart.getTime() - Date.now()) / 3_600_000 : 0;
    return hoursUntil <= 24 ? { ...i, status: "Expired" } : i;
  }), [allInvitations, myJockeyId]);
  const [viewing, setViewing] = useState<typeof data[number] | null>(null);

  const accept = async (id: string, backendId?: number) => {
    if (!backendId) return;
    await acceptJockeyInvitation(backendId);
    setViewing(null);
  };

  const viewingRace = viewing ? getRace(viewing.raceId) : null;
  const viewingHorse = viewing ? getHorse(viewing.horseId) : null;
  const viewingOwner = viewing ? getOwner(viewing.ownerId) : null;

  return (
    <div>
      <PageHeader title="Invitations" subtitle="View race & horse details before accepting" />
      <DataTable
        columns={[
          { key: "id", header: "ID" },
          { key: "race", header: "Race", render: r => { const race = getRace(r.raceId); return race ? `${race.id} · ${race.track}` : r.raceId; } },
          { key: "horse", header: "Horse", render: r => getHorse(r.horseId)?.name },
          { key: "owner", header: "Owner", render: r => getOwner(r.ownerId)?.name },
          { key: "date", header: "Race Date", render: r => getRace(r.raceId)?.date },
          { key: "sentAt", header: "Sent" },
          { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
          { key: "actions", header: "Actions", render: r => (
            <Button variant="secondary" onClick={() => setViewing(r)}><Eye className="h-4 w-4" /> View</Button>
          )},
        ]}
        rows={data}
      />

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? `Invitation ${viewing.id}` : ""}
      >
        {viewing && viewingRace && viewingHorse && viewingOwner && (
          <div className="space-y-4 text-sm">
            <div className="bg-muted/40 border border-border rounded-md p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Race</div>
              <div className="font-semibold text-foreground">{viewingRace.id} · Round {viewingRace.round}</div>
              <div className="grid grid-cols-2 gap-y-1 text-xs mt-2">
                <div className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {viewingRace.date} {viewingRace.time}</div>
                <div className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {viewingRace.track} · {viewingRace.distance}m</div>
                <div className="col-span-2 text-muted-foreground">Eligibility: age {viewingRace.eligibility.minAge}-{viewingRace.eligibility.maxAge}, weight {viewingRace.eligibility.minWeight}-{viewingRace.eligibility.maxWeight}kg, {viewingRace.eligibility.allowedBreeds.join("/")}</div>
                <div className="col-span-2 flex items-center gap-1.5 text-foreground font-medium"><Trophy className="h-3.5 w-3.5 text-warning" /> Top prize: ${viewingRace.prizes[0]?.money.toLocaleString()} · {viewingRace.prizes[0]?.trophy}</div>
              </div>
            </div>

            <div className="bg-muted/40 border border-border rounded-md p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Horse</div>
              <div className="font-semibold text-foreground">{viewingHorse.name}</div>
              <div className="text-xs text-muted-foreground">{viewingHorse.breed} · Age {viewingHorse.age} · <Weight className="h-3 w-3 inline" /> {viewingHorse.weight}kg · {viewingHorse.color}</div>
              <div className="text-xs text-muted-foreground mt-1">Trainer: <span className="text-foreground">{viewingHorse.trainer ?? "—"}</span></div>
              {viewingHorse.bio && <p className="text-xs text-muted-foreground mt-2">{viewingHorse.bio}</p>}
              <div className="text-xs mt-2">Status: <StatusBadge status={viewingHorse.status} /></div>
            </div>

            <div className="bg-muted/40 border border-border rounded-md p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Owner</div>
              <div className="text-foreground font-medium">{viewingOwner.name} <span className="text-muted-foreground text-xs">· {viewingOwner.stable}</span></div>
              <div className="text-xs text-muted-foreground mt-1">{viewingOwner.contact}</div>
            </div>

            {(viewing as any).note && (
              <div className="bg-muted/40 border border-border rounded-md p-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Owner's Message</div>
                <p className="text-sm text-foreground italic">"{(viewing as any).note}"</p>
              </div>
            )}

            {viewing.status === "Waiting" ? (
              <div className="flex gap-2 justify-end pt-2 border-t border-border">
                <Button onClick={() => void accept(viewing.id, viewing.backendId)}><CheckCircle2 className="h-4 w-4" /> Accept</Button>
              </div>
            ) : (
              <div className="text-right text-xs text-muted-foreground pt-2 border-t border-border">
                This invitation is already <span className="font-medium text-foreground">{viewing.status}</span>.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
