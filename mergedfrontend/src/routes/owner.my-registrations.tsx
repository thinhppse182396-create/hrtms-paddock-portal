import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { usePersistentCollection } from "@/hooks/usePersistentCollection";

export const Route = createFileRoute("/owner/my-registrations")({ component: MyRegistrations });

const OWNER_ID = "O001";

type Reg = (typeof regSeed)[number] & { reason?: string; backupJockeyId?: string };
type Result = (typeof resultSeed)[number];

function MyRegistrations() {
  const [allRegs, setAllRegs, loading] = usePersistentCollection<Reg>("admin:registrations", regSeed as Reg[]);
  const [results] = usePersistentCollection<Result>("admin:results", resultSeed);
  const [viewing, setViewing] = useState<Reg | null>(null);

  const data = useMemo(() => allRegs.filter(r => r.ownerId === OWNER_ID), [allRegs]);

  const cancel = (id: string) => {
    setAllRegs(d => d.map(r => r.id === id ? { ...r, status: "Cancelled" } : r));
    toast.success("Registration cancelled", { description: id });
  };

  // Primary jockey sick → promote the backup jockey into the primary slot.
  const useBackup = (id: string) => {
    setAllRegs(d => d.map(r => {
      if (r.id !== id || !r.backupJockeyId) return r;
      return { ...r, jockeyId: r.backupJockeyId, backupJockeyId: undefined, reason: "Primary jockey sick — backup promoted" };
    }));
    toast.success("Backup jockey promoted to primary", { description: id });
  };

  const viewingResult = viewing
    ? results.find(r => r.raceId === viewing.raceId && r.horseId === viewing.horseId)
    : null;
  const viewingRace = viewing ? getRace(viewing.raceId) : null;

  return (
    <div>
      <PageHeader title="My Registrations" subtitle="Track and manage your race entries" />
      <DataTable
        columns={[
          { key: "id", header: "ID" },
          { key: "raceId", header: "Race" },
          { key: "horse", header: "Horse", render: r => getHorse(r.horseId)?.name },
          { key: "jockey", header: "Jockey", render: r => getJockey(r.jockeyId)?.name },
          { key: "backup", header: "Backup", render: r => r.backupJockeyId ? getJockey(r.backupJockeyId)?.name : "—" },
          { key: "submittedAt", header: "Submitted" },
          { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
          { key: "reason", header: "Note", render: r => (r as any).reason ?? "—" },
          { key: "actions", header: "Actions", render: r => (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setViewing(r)}>View Result</Button>
              {r.backupJockeyId && (r.status === "Pending" || r.status === "Approved") && (
                <Button variant="ghost" onClick={() => useBackup(r.id)}>Use Backup Jockey</Button>
              )}
              {(r.status === "Pending" || r.status === "Approved") && (
                <Button variant="danger" onClick={() => cancel(r.id)}>Cancel</Button>
              )}
            </div>
          )},
        ]}
        rows={data}
        loading={loading}
        empty="No registrations yet."
      />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing ? `Result — ${viewing.raceId} · ${getHorse(viewing.horseId)?.name}` : ""}>
        {viewing && (
          <div className="space-y-3 text-sm">
            <div className="text-xs text-muted-foreground">{viewingRace?.track} · {viewingRace?.distance}m · {viewingRace?.date}</div>
            {viewingResult ? (
              <div className="rounded-md border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Final rank</span>
                  <span className="text-lg font-bold text-foreground">{viewingResult.disqualified ? "DQ" : `#${viewingResult.rank}`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Finish time</span>
                  <span className="font-mono">{viewingResult.finishTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Prize won</span>
                  <span className="font-semibold text-success">
                    ${(!viewingResult.disqualified ? (viewingRace?.prizes.find(p => p.rank === viewingResult.rank)?.money ?? 0) : 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Published</span>
                  <StatusBadge status={(viewingResult as any).published ? "Published" : "Pending"} />
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border p-6 text-center text-muted-foreground">
                Chưa có kết quả cho race này.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
