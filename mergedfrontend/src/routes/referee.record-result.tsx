import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { usePersistentCollection } from "@/hooks/usePersistentCollection";
import { Send } from "lucide-react";

type Result = (typeof seed)[number];

export const Route = createFileRoute("/referee/record-result")({ component: ResultRecording });

function ResultRecording() {
  // SHARED key with Admin Publish Results — referee submit -> admin sees instantly.
  const [rows, setRows] = usePersistentCollection<Result>("admin:results", seed);

  const [raceId, setRaceId] = useState(races[0]?.id ?? "");
  const race = getRace(raceId);
  const entries = useMemo(
    () => registrations.filter(r => r.raceId === raceId && r.status === "Approved"),
    [raceId],
  );

  const [times, setTimes] = useState<Record<string, string>>({});
  const [dq, setDq] = useState<Record<string, boolean>>({});

  const draft = entries.map(e => ({
    horseId: e.horseId,
    jockeyId: e.jockeyId,
    finishTime: times[e.horseId] ?? "",
    disqualified: !!dq[e.horseId],
  }));
  const ranked = [...draft]
    .filter(d => !d.disqualified && d.finishTime)
    .sort((a, b) => a.finishTime.localeCompare(b.finishTime))
    .map((d, i) => ({ ...d, rank: i + 1 }));

  const submit = () => {
    if (!race) return;
    if (ranked.length === 0 && !draft.some(d => d.disqualified)) {
      toast.error("Cần nhập ít nhất 1 finish time hoặc đánh dấu DQ"); return;
    }
    // Replace any prior rows for this race with the new draft.
    const others = rows.filter(r => r.raceId !== raceId);
    const submitted: Result[] = draft.map(d => {
      const r = ranked.find(x => x.horseId === d.horseId);
      return {
        raceId,
        horseId: d.horseId,
        jockeyId: d.jockeyId,
        finishTime: d.disqualified ? "—" : d.finishTime,
        rank: r?.rank ?? 0,
        disqualified: d.disqualified,
        published: false,
      };
    });
    setRows([...others, ...submitted]);
    toast.success("Đã gửi kết quả lên Admin", { description: `${raceId} • ${submitted.length} runners` });
  };

  return (
    <div>
      <PageHeader title="Record Result" subtitle="Nhập finish time, đánh dấu DQ rồi submit — Admin sẽ thấy ngay trong Publish Results." />

      <div className="mb-4 flex gap-3 items-center">
        <label className="text-xs text-muted-foreground">Race</label>
        <select className="px-3 py-2 border border-input rounded bg-card text-sm" value={raceId} onChange={e => { setRaceId(e.target.value); setTimes({}); setDq({}); }}>
          {races.map(r => <option key={r.id} value={r.id}>{r.id} — {r.track} ({r.date})</option>)}
        </select>
        {race && <StatusBadge status={race.status} />}
      </div>

      <DataTable
        columns={[
          { key: "horseName", header: "Horse", render: r => getHorse(r.horseId)?.name ?? r.horseId },
          { key: "jockey", header: "Jockey", render: r => getJockey(r.jockeyId)?.name ?? r.jockeyId },
          { key: "time", header: "Finish Time", render: r => (
            <input
              className="px-2 py-1 border border-input rounded text-sm w-32 bg-background"
              placeholder="m:ss.ss"
              value={times[r.horseId] ?? ""}
              disabled={!!dq[r.horseId]}
              onChange={e => setTimes(t => ({ ...t, [r.horseId]: e.target.value }))}
            />
          )},
          { key: "dq", header: "Disqualify", render: r => (
            <input type="checkbox" checked={!!dq[r.horseId]} onChange={e => setDq(d => ({ ...d, [r.horseId]: e.target.checked }))} />
          )},
        ]}
        rows={draft}
        empty="Race này chưa có registration approved."
      />

      <h2 className="text-sm font-semibold text-foreground mb-3 mt-6">Preview Ranking</h2>
      <DataTable
        columns={[
          { key: "rank", header: "Rank" },
          { key: "horseName", header: "Horse", render: r => getHorse(r.horseId)?.name },
          { key: "finishTime", header: "Time" },
        ]}
        rows={ranked}
        empty="Nhập finish time để preview ranking"
      />

      <div className="mt-6 flex gap-2">
        <Button onClick={submit}><Send className="h-4 w-4" /> Submit to Admin</Button>
      </div>
    </div>
  );
}
