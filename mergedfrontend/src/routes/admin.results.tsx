import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FormModal, ConfirmDialog, type Field } from "@/components/common/FormModal";
import { TableToolbar } from "@/components/common/TableToolbar";
import { usePersistentCollection } from "@/hooks/usePersistentCollection";
import { raceResults as seed, refereeReports, getHorse, getJockey, getRace, horses, jockeys, races, registrations } from "@/data/mockData";
import { usePersistentCollection as _useRaces } from "@/hooks/usePersistentCollection";
import type { Race } from "@/data/mockData";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/admin/results")({ component: ResultPublishing });

type Result = (typeof seed)[number];

// Parse a finish time like "1:22.34" or "82.34" into seconds for ordering.
function parseTime(t: string): number | null {
  if (!t) return null;
  const m = String(t).trim().match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const mins = m[1] ? Number(m[1]) : 0;
  return mins * 60 + Number(m[2]);
}

const fields: Field[] = [
  { name: "raceId", label: "Race", type: "select", required: true, options: races.map(r => ({ label: `${r.id} — ${r.track}`, value: r.id })) },
  { name: "horseId", label: "Horse", type: "select", required: true, options: horses.map(h => ({ label: h.name, value: h.id })) },
  { name: "jockeyId", label: "Jockey", type: "select", required: true, options: jockeys.map(j => ({ label: j.name, value: j.id })) },
  { name: "rank", label: "Rank", type: "number", required: true, min: 1 },
  { name: "finishTime", label: "Finish time", placeholder: "1:22.34", required: true },
  { name: "disqualified", label: "Disqualified", type: "select", options: [{ label: "No", value: "false" }, { label: "Yes", value: "true" }] },
];

function ResultPublishing() {
  const [rows, setRows, loading] = usePersistentCollection<Result>("admin:results", seed);
  const [raceRows, setRaceRows] = _useRaces<Race>("admin:races", races);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Result | null>(null);
  const [deleting, setDeleting] = useState<Result | null>(null);
  const reportMap = new Map(refereeReports.map(r => [r.raceId, r.status]));

  const [q, setQ] = useState("");
  const [raceFilter, setRaceFilter] = useState("");

  const publish = (raceId: string) => {
    setRows(d => d.map(r => r.raceId === raceId ? { ...r, published: true } : r));
    setRaceRows(rs => rs.map(r => r.id === raceId ? { ...r, status: "Published" as Race["status"] } : r));
    toast.success("Results published", { description: raceId });
  };
  const upsert = (v: any) => {
    const result: Result = {
      raceId: v.raceId, horseId: v.horseId, jockeyId: v.jockeyId,
      rank: Number(v.rank), finishTime: v.finishTime,
      disqualified: String(v.disqualified) === "true",
      published: editing?.published ?? false,
    };
    const isEdit = !!editing;
    setRows(rs => isEdit ? rs.map(x => x === editing ? result : x) : [...rs, result]);
    setQ(""); setRaceFilter("");
    setCreating(false); setEditing(null);
    toast.success(isEdit ? "Result updated" : "Result added", { description: `${result.raceId} • rank #${result.rank}` });
  };
  const remove = (r: Result) => {
    setRows(rs => rs.filter(x => x !== r));
    setDeleting(null);
    toast.success("Result deleted", { description: `${r.raceId} • ${getHorse(r.horseId)?.name}` });
  };

  const visible = useMemo(() => rows.filter(r => {
    const m = q.trim().toLowerCase();
    if (m && !`${getHorse(r.horseId)?.name ?? ""} ${getJockey(r.jockeyId)?.name ?? ""}`.toLowerCase().includes(m)) return false;
    if (raceFilter && r.raceId !== raceFilter) return false;
    return true;
  }), [rows, q, raceFilter]);

  const grouped = Array.from(new Set(visible.map(d => d.raceId))).map(raceId => {
    const liveRace = raceRows.find(r => r.id === raceId) ?? getRace(raceId);
    return {
      raceId,
      race: liveRace,
      rows: visible.filter(d => d.raceId === raceId).sort((a, b) => a.rank - b.rank),
      reportStatus: reportMap.get(raceId) ?? "Missing",
      raceStatus: liveRace?.status ?? "",
    };
  });

  return (
    <div>
      <PageHeader title="Result Publishing" subtitle="Publish confirmed race results"
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Add Result</Button>} />
      <TableToolbar
        search={q} onSearch={setQ} searchPlaceholder="Search by horse or jockey…"
        filters={[
          { key: "race", label: "Races", value: raceFilter, onChange: setRaceFilter, options: races.map(r => ({ label: `${r.id} — ${r.track}`, value: r.id })) },
        ]}
      />
      <div className="space-y-6">
        {loading ? (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-border"><div className="h-4 w-40 bg-primary/10 rounded animate-pulse" /></div>
            <DataTable columns={[{key:"rank",header:"Rank"},{key:"horse",header:"Horse"},{key:"jockey",header:"Jockey"},{key:"finishTime",header:"Finish Time"},{key:"status",header:"Status"},{key:"actions",header:"Actions"}]} rows={[]} loading />
          </div>
        ) : (
          <>
            {grouped.length === 0 && (
              <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground text-sm">No results match current filters.</div>
            )}
            {grouped.map(g => {
              const allPublished = g.rows.every(r => r.published);
              const isFinished = g.raceStatus === "Finished" || g.raceStatus === "Completed";
              const canPublish = isFinished && !allPublished;
              return (
                <div key={g.raceId} className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        {g.raceId} — {g.race?.track}
                        <StatusBadge status={g.raceStatus || "Unknown"} />
                      </div>
                      <div className="text-xs text-muted-foreground">Referee report: <StatusBadge status={g.reportStatus} /></div>
                      {!isFinished && !allPublished && (
                        <div className="text-xs text-warning mt-1">⚠ Race must be Finished before publishing results</div>
                      )}
                    </div>
                    {allPublished ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 text-success px-3 py-1 text-sm font-medium">✓ Published</span>
                    ) : (
                      <Button variant="primary" disabled={!canPublish} onClick={() => publish(g.raceId)}>
                        Publish Result
                      </Button>
                    )}
                  </div>
                  <DataTable
                    columns={[
                      { key: "rank", header: "Rank" },
                      { key: "horse", header: "Horse", render: r => getHorse(r.horseId)?.name },
                      { key: "jockey", header: "Jockey", render: r => getJockey(r.jockeyId)?.name },
                      { key: "finishTime", header: "Finish Time" },
                      { key: "status", header: "Status", render: r => <StatusBadge status={r.disqualified ? "Disqualified" : r.published ? "Published" : "Pending"} /> },
                      { key: "actions", header: "Actions", render: r => (
                        <div className="flex gap-2">
                          <Button variant="ghost" onClick={() => setEditing(r)}>Edit</Button>
                          <Button variant="danger" onClick={() => setDeleting(r)}>Delete</Button>
                        </div>
                      )},
                    ]}
                    rows={g.rows}
                  />
                </div>
              );
            })}
          </>
        )}
      </div>

      <FormModal
        open={creating || !!editing}
        title={editing ? "Edit Result" : "Add Result"}
        fields={fields}
        initial={editing ? { ...editing, disqualified: String(editing.disqualified) } as any : {} as any}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={upsert}
        validate={(v: any) => {
          const e: Record<string, string> = {};
          const rank = Number(v.rank);
          const dq = String(v.disqualified) === "true";
          if (!Number.isInteger(rank) || rank < 1) e.rank = "Rank must be a whole number ≥ 1";

          const others = rows.filter(r => r !== editing && r.raceId === v.raceId);

          // No duplicate ranks (ignore disqualified rows which carry no rank weight)
          if (!dq && others.some(r => !r.disqualified && Number(r.rank) === rank)) e.rank = `Rank #${rank} already used in ${v.raceId}`;
          // One result per horse per race
          if (others.some(r => r.horseId === v.horseId)) e.horseId = "Horse already has a result for this race";

          // Finishers ≤ starters (approved registrations)
          const starters = registrations.filter(r => r.raceId === v.raceId && r.status === "Approved").length;
          const finishers = others.filter(r => !r.disqualified).length + (dq ? 0 : 1);
          if (starters > 0 && finishers > starters) e.rank = `Finishers (${finishers}) cannot exceed starters (${starters})`;

          // Finish times must be ordered: lower rank ⇒ faster (smaller) time
          const t = parseTime(v.finishTime);
          if (v.finishTime && t === null) e.finishTime = "Use m:ss.dd or seconds (e.g. 1:22.34)";
          if (!dq && t !== null) {
            for (const r of others) {
              if (r.disqualified) continue;
              const rt = parseTime(r.finishTime);
              if (rt === null) continue;
              if (Number(r.rank) < rank && rt > t) e.finishTime = `Rank #${rank} time must be slower than rank #${r.rank} (${r.finishTime})`;
              if (Number(r.rank) > rank && rt < t) e.finishTime = `Rank #${rank} time must be faster than rank #${r.rank} (${r.finishTime})`;
            }
          }
          return Object.keys(e).length ? e : null;
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete result?"
        message={`Remove result for ${deleting && getHorse(deleting.horseId)?.name}?`}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting)}
      />
    </div>
  );
}