import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Eye, MapPin, Calendar, Flag } from "lucide-react";

export const Route = createFileRoute("/referee/assigned-races")({ component: AssignedRaces });

function AssignedRaces() {
  const myRefId = "RF001";
  const ids = refereeAssignments.filter(a => a.refereeId === myRefId).map(a => a.raceId);
  const rows = races.filter(r => ids.includes(r.id));
  const [viewing, setViewing] = useState<Race | null>(null);

  const field = viewing
    ? registrations
        .filter(r => r.raceId === viewing.id && r.status === "Approved")
        .map(r => ({ ...r, horse: getHorse(r.horseId), jockey: getJockey(r.jockeyId) }))
    : [];

  return (
    <div>
      <PageHeader title="Assigned Races" subtitle="Races you are responsible for" />
      <DataTable
        columns={[
          { key: "id", header: "Race" },
          { key: "tournament", header: "Tournament", render: r => getTournament(r.tournamentId)?.name },
          { key: "round", header: "Round" },
          { key: "date", header: "Date", render: r => `${r.date} ${r.time}` },
          { key: "track", header: "Track" },
          { key: "distance", header: "Distance", render: r => `${r.distance}m` },
          { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
          { key: "actions", header: "Actions", render: r => <Button variant="secondary" onClick={() => setViewing(r)}><Eye className="h-4 w-4" /> View Race</Button> },
        ]}
        rows={rows}
      />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing ? `${viewing.id} — ${viewing.track}` : ""}>
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2"><Flag className="h-4 w-4 text-muted-foreground" /> {getTournament(viewing.tournamentId)?.name} · Round {viewing.round}</div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> {viewing.date} {viewing.time}</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {viewing.track} · {viewing.distance}m</div>
              <div className="flex items-center gap-2">Status: <StatusBadge status={viewing.status} /></div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Field — {field.length} approved entries</h4>
              {field.length > 0 ? (
                <table className="w-full text-sm">
                  <thead><tr className="text-xs uppercase text-muted-foreground"><th className="text-left py-1.5">Horse</th><th className="text-left">Jockey</th><th className="text-left">Breed</th><th className="text-right">Age</th></tr></thead>
                  <tbody>
                    {field.map(f => (
                      <tr key={f.horseId} className="border-t border-border">
                        <td className="py-1.5 font-medium">{f.horse?.name ?? f.horseId}</td>
                        <td>{f.jockey?.name ?? "—"}</td>
                        <td>{f.horse?.breed ?? "—"}</td>
                        <td className="text-right">{f.horse?.age ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">No approved entries yet.</div>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
