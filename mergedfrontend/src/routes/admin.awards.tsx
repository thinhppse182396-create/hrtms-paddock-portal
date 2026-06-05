import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { StatCard } from "@/components/common/StatCard";
import { StatCardSkeleton } from "@/components/common/StatCardSkeleton";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { FormModal, ConfirmDialog, type Field } from "@/components/common/FormModal";
import { TableToolbar } from "@/components/common/TableToolbar";
import { type AwardCeremony, type Race } from "@/data/mockData"; 
import { Trophy, Calendar, DollarSign, Medal, Crown, PlayCircle, Plus, Layers, Coins } from "lucide-react";
import api from '@/api';
// Thêm import hàm API của bạn vào đây (Hãy đổi lại đường dẫn import đúng thực tế)
import { getRaceAwards } from "@/service/awardAPI"; 

export const Route = createFileRoute("/admin/awards")({ component: AdminAwards });

// Định nghĩa Interface dữ liệu giải thưởng từ API để quản lý bằng TypeScript tốt hơn
interface RaceAwardData {
  pool: number;
  guaranteed: number;
  fromBets: number;
  confirmed: number;
  breakdown: Array<{
    rank: number;
    total: number;
    owner: number;
    jockey: number;
    management: number;
  }>;
}

const prizeFields: Field[] = [
  { name: "p1_money", label: "1st prize ($)", type: "number", required: true },
  { name: "p1_trophy", label: "1st trophy", required: true },
  { name: "p2_money", label: "2nd prize ($)", type: "number", required: true },
  { name: "p2_trophy", label: "2nd trophy", required: true },
  { name: "p3_money", label: "3rd prize ($)", type: "number", required: true },
  { name: "p3_trophy", label: "3rd trophy", required: true },
];

function AdminAwards() {
  // --- Các State quản lý dữ liệu từ API ---
  const [ceremonies, setCeremonies] = useState<AwardCeremony[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [horses, setHorses] = useState<any[]>([]);
  const [jockeys, setJockeys] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // State mới phục vụ riêng cho việc lưu thông tin kết quả gọi từ hàm getRaceAwards
  const [raceAwards, setRaceAwards] = useState<Record<string, RaceAwardData>>({});
  const [awardsLoading, setAwardsLoading] = useState<boolean>(true);

  // --- Các State quản lý UI ---
  const [viewingRaceId, setViewingRaceId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AwardCeremony | null>(null);
  const [deleting, setDeleting] = useState<AwardCeremony | null>(null);
  const [editingPrize, setEditingPrize] = useState<Race | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  // --- Gọi GET API khi component được khởi chạy ---
  useEffect(() => {
    const fetchAllAdminData = async () => {
      setLoading(true);
      setAwardsLoading(true);
      try {
        const [
          resCeremonies, 
          resRaces, 
          resResults, 
          resRegistrations, 
          resTournaments,
          resHorses,
          resJockeys,
          resOwners
        ] = await Promise.all([
        api.get("/admin/award-ceremonies").then(r => r.data),
        api.get("/admin/races").then(r => r.data),
        api.get("/admin/results").then(r => r.data),
        api.get("/admin/registrations").then(r => r.data),
        api.get("/admin/tournaments").then(r => r.data),
        api.get("/admin/horses").then(r => r.data),
        api.get("/admin/jockeys").then(r => r.data),
        api.get("/admin/owners").then(r => r.data),
        ]);

        setCeremonies(resCeremonies);
        setRaces(resRaces);
        setResults(resResults);
        setRegistrations(resRegistrations);
        setTournaments(resTournaments);
        setHorses(resHorses);
        setJockeys(resJockeys);
        setOwners(resOwners);

        // [TÍCH HỢP MỚI]: Kích hoạt đồng thời việc gọi API lấy thông tin quỹ thưởng thực tế cho từng trận đấu
        const awardsPromises = resRaces.map(async (r: Race) => {
          try {
            const data = await getRaceAwards(r.id);
            return { raceId: r.id, data };
          } catch (err) {
            console.error(`Không thể lấy dữ liệu quỹ thưởng trận ${r.id}:`, err);
            return { raceId: r.id, data: null };
          }
        });

        const awardsResults = await Promise.all(awardsPromises);
        const awardsMap: Record<string, RaceAwardData> = {};
        
        awardsResults.forEach(item => {
          if (item.data) {
            awardsMap[item.raceId] = item.data;
          }
        });
        setRaceAwards(awardsMap);

      } catch (error) {
        console.error("Lỗi khi tải dữ liệu tổng thể từ API:", error);
        toast.error("Không thể tải dữ liệu quản trị. Vui lòng thử lại!");
      } finally {
        setLoading(false);
        setAwardsLoading(false);
      }
    };

    fetchAllAdminData();
  }, []);

  // --- Map Lookups tối ưu hóa tốc độ tìm kiếm bản ghi liên quan ---
  const tournamentMap = useMemo(() => new Map(tournaments.map(t => [t.id, t])), [tournaments]);
  const raceMap = useMemo(() => new Map(races.map(r => [r.id, r])), [races]);
  const horseMap = useMemo(() => new Map(horses.map(h => [h.id, h])), [horses]);
  const jockeyMap = useMemo(() => new Map(jockeys.map(j => [j.id, j])), [jockeys]);
  const ownerMap = useMemo(() => new Map(owners.map(o => [o.id, o])), [owners]);

  const getTournament = (id: string) => tournamentMap.get(id);
  const getRace = (id: string) => raceMap.get(id);
  const getHorse = (id: string) => horseMap.get(id);
  const getJockey = (id: string) => jockeyMap.get(id);
  const getOwner = (id: string) => ownerMap.get(id);

  const ceremonyFields = useMemo<Field[]>(() => [
    { 
      name: "raceId", 
      label: "Race", 
      type: "select", 
      required: true, 
      options: races.map(r => ({ label: `${r.id} — ${r.track}`, value: r.id })) 
    },
    { name: "scheduledAt", label: "Scheduled at", required: true, placeholder: "2026-04-10 19:00" },
    { name: "venue", label: "Venue", required: true, full: true },
    { name: "status", label: "Status", type: "select", required: true, options: ["Scheduled", "Held", "Cancelled"].map(s => ({ label: s, value: s })) },
    { name: "notes", label: "Notes", type: "textarea" },
  ], [races]);

  const totalPrizePool = races.reduce((s, r) => s + r.prizes.reduce((x, p) => x + p.money, 0), 0);
  const totalHeld = ceremonies.filter(c => c.status === "Held").length;

  const viewingRace = viewingRaceId ? getRace(viewingRaceId) : null;
  const podium = viewingRaceId
    ? results.filter(r => r.raceId === viewingRaceId && !r.disqualified).sort((a, b) => a.rank - b.rank).slice(0, 3)
    : [];

  // --- Các hàm cập nhật dữ liệu (POST/PUT/DELETE) ---
  const upsertCeremony = async (v: AwardCeremony) => {
    const isEdit = !!editing;
    try {
      const url = isEdit ? `/api/admin/award-ceremonies/${editing.raceId}` : "/api/admin/award-ceremonies";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v)
      });

      if (!res.ok) throw new Error("API Error");
      const savedCeremony = await res.json();

      setCeremonies(cs => isEdit ? cs.map(c => c.raceId === editing.raceId ? savedCeremony : c) : [...cs, savedCeremony]);
      setQ(""); setStatus("");
      setCreating(false); setEditing(null);
      toast.success(isEdit ? "Ceremony updated" : "Ceremony created", { description: `${v.raceId} • ${v.venue}` });
    } catch {
      toast.error("Không thể lưu thông tin buổi lễ.");
    }
  };

  const removeCeremony = async (c: AwardCeremony) => {
    try {
      const res = await fetch(`/api/admin/award-ceremonies/${c.raceId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("API Error");

      setCeremonies(cs => cs.filter(x => x.raceId !== c.raceId));
      setDeleting(null);
      toast.success("Ceremony deleted", { description: c.raceId });
    } catch {
      toast.error("Xóa buổi lễ thất bại.");
    }
  };

  const savePrizes = async (v: any) => {
    if (!editingPrize) return;
    const updatedPrizes = [
      { rank: 1, money: Number(v.p1_money), trophy: v.p1_trophy },
      { rank: 2, money: Number(v.p2_money), trophy: v.p2_trophy },
      { rank: 3, money: Number(v.p3_money), trophy: v.p3_trophy },
    ];

    try {
      const res = await fetch(`/api/admin/races/${editingPrize.id}/prizes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prizes: updatedPrizes })
      });

      if (!res.ok) throw new Error("API Error");

      setRaces(rs => rs.map(r => r.id === editingPrize.id ? { ...r, prizes: updatedPrizes } : r));
      toast.success("Prizes updated", { description: editingPrize.id });
      setEditingPrize(null);
    } catch {
      toast.error("Cập nhật giải thưởng thất bại.");
    }
  };

  const filteredCeremonies = useMemo(() => ceremonies.filter(c => {
    const m = q.trim().toLowerCase();
    if (m && !`${c.raceId} ${c.venue} ${getRace(c.raceId)?.track ?? ""}`.toLowerCase().includes(m)) return false;
    if (status && c.status !== status) return false;
    return true;
  }), [ceremonies, q, status, races]);

  return (
    <div>
      <PageHeader title="Award Management" subtitle="Configure prize money, trophies and ceremony schedule"
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New Ceremony</Button>} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {loading ? (
          <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
        ) : (
          <>
            <StatCard label="Total Prize Pool" value={`$${totalPrizePool.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} />
            <StatCard label="Ceremonies Scheduled" value={ceremonies.filter(c => c.status === "Scheduled").length} icon={<Calendar className="h-5 w-5" />} />
            <StatCard label="Ceremonies Held" value={totalHeld} icon={<Trophy className="h-5 w-5" />} />
          </>
        )}
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Race Prize Configuration</h2>
      <div className="mb-6 space-y-4">
        {loading ? (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-border"><div className="h-4 w-40 bg-primary/10 rounded animate-pulse" /></div>
            <DataTable columns={[{key:"round",header:"Round"},{key:"id",header:"Race"},{key:"track",header:"Track"},{key:"first",header:"1st"},{key:"second",header:"2nd"},{key:"third",header:"3rd"},{key:"total",header:"Round Total"},{key:"actions",header:"Actions"}]} rows={[]} loading />
          </div>
        ) : (
          Object.values(
            races.reduce<Record<string, Race[]>>((acc, r) => {
              (acc[r.tournamentId] ||= []).push(r); return acc;
            }, {})
          )
            .map(group => group.slice().sort((a, b) => a.round - b.round))
            .sort((a, b) => a[0].tournamentId.localeCompare(b[0].tournamentId))
            .map(group => {
              const t = getTournament(group[0].tournamentId);
              const multi = group.length > 1;
              const tournamentTotal = group.reduce((s, r) => s + r.prizes.reduce((x, p) => x + p.money, 0), 0);
              return (
                <div key={group[0].tournamentId} className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="font-semibold text-foreground truncate">{t?.name ?? group[0].tournamentId}</div>
                      {multi && (
                        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-accent text-foreground border border-border">
                          {group.length} rounds
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Tournament total: <span className="text-foreground font-semibold">${tournamentTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <DataTable
                    columns={[
                      { key: "round", header: "Round", render: r => (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">R{r.round}</span>
                          {multi && r.round === group.length && (
                            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-warning/15 text-warning border border-warning/30">Final</span>
                          )}
                        </div>
                      )},
                      { key: "id", header: "Race" },
                      { key: "track", header: "Track", render: r => `${r.track} · ${r.distance}m` },
                      { key: "first", header: "1st", render: r => `$${r.prizes[0]?.money.toLocaleString()} · ${r.prizes[0]?.trophy}` },
                      { key: "second", header: "2nd", render: r => `$${r.prizes[1]?.money.toLocaleString()} · ${r.prizes[1]?.trophy}` },
                      { key: "third", header: "3rd", render: r => `$${r.prizes[2]?.money.toLocaleString()} · ${r.prizes[2]?.trophy}` },
                      { key: "total", header: "Round Total", render: r => `$${r.prizes.reduce((s, p) => s + p.money, 0).toLocaleString()}` },
                      { key: "actions", header: "Actions", render: r => <Button variant="ghost" onClick={() => setEditingPrize(r)}>Edit Prizes</Button> },
                    ]}
                    rows={group}
                  />
                </div>
              );
            })
        )}
      </div>

      {/* --- PHÂN ĐOẠN ĐÃ ĐƯỢC CHUYỂN ĐỔI SANG API TỪ HÀM getRaceAwards --- */}
      <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Coins className="h-4 w-4" /> Actual Prize Pool (HRTMS §7)</h2>
      <p className="text-xs text-muted-foreground mb-3">Pool = MAX(Guaranteed minimum, Betting contribution 20%×40%). Phân bổ theo position % rồi chia 80/10/10 (Owner/Jockey/Management).</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {loading || awardsLoading ? (
          <div className="col-span-full py-8 text-center text-sm text-muted-foreground animate-pulse">
            Đang tải dữ liệu quỹ thưởng thực tế từ hệ thống...
          </div>
        ) : (
          races.map(r => {
            const awardData = raceAwards[r.id];
            
            // Nếu không lấy được data của trận đấu từ API, không hiển thị card đó
            if (!awardData) return null;

            // Destructure toàn bộ thuộc tính mà Server trả ra từ hàm getRaceAwards()
            const { pool, guaranteed, fromBets, confirmed, breakdown = [] } = awardData;

            return (
              <div key={r.id} className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="font-semibold text-foreground">{r.id} — {r.track}</div>
                    <div className="text-[11px] text-muted-foreground">{getTournament(r.tournamentId)?.name} · {r.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-muted-foreground">Actual pool</div>
                    <div className="text-lg font-bold text-success">${Math.round(pool).toLocaleString()}</div>
                  </div>
                </div>
                <div className="px-4 py-3 grid grid-cols-3 gap-2 text-[11px] border-b border-border bg-muted/30">
                  <div><div className="text-muted-foreground">Guaranteed min</div><div className="font-semibold text-foreground">${Math.round(guaranteed).toLocaleString()}</div></div>
                  <div><div className="text-muted-foreground">Betting (20%×40%)</div><div className="font-semibold text-foreground">${Math.round(fromBets).toLocaleString()}</div></div>
                  <div><div className="text-muted-foreground">Confirmed</div><div className="font-semibold text-foreground">{confirmed} horse{confirmed > 1 ? "s" : ""}</div></div>
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr><th className="text-left px-3 py-1.5">#</th><th className="text-right px-3">Total</th><th className="text-right px-3">Owner 80%</th><th className="text-right px-3">Jockey 10%</th><th className="text-right px-3 pr-4">Mgmt 10%</th></tr>
                  </thead>
                  <tbody>
                    {breakdown.map(b => (
                      <tr key={b.rank} className="border-t border-border">
                        <td className="px-3 py-1.5 font-medium text-foreground">#{b.rank}</td>
                        <td className="text-right px-3">${Math.round(b.total).toLocaleString()}</td>
                        <td className="text-right px-3">${Math.round(b.owner).toLocaleString()}</td>
                        <td className="text-right px-3">${Math.round(b.jockey).toLocaleString()}</td>
                        <td className="text-right px-3 pr-4">${Math.round(b.management).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Award Ceremonies</h2>
      <TableToolbar
        search={q} onSearch={setQ} searchPlaceholder="Search by race, track or venue…"
        filters={[
          { key: "status", label: "Statuses", value: status, onChange: setStatus, options: ["Scheduled","Held","Cancelled"].map(s => ({ label: s, value: s })) },
        ]}
      />
      <DataTable
        columns={[
          { key: "raceId", header: "Race" },
          { key: "race", header: "Track", render: c => getRace(c.raceId)?.track ?? "—" },
          { key: "scheduledAt", header: "When" },
          { key: "venue", header: "Venue" },
          { key: "status", header: "Status", render: c => <StatusBadge status={c.status} /> },
          { key: "actions", header: "Actions", render: c => (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setViewingRaceId(c.raceId)}><PlayCircle className="h-4 w-4" /> Ceremony</Button>
              <Button variant="ghost" onClick={() => setEditing(c)}>Edit</Button>
              <Button variant="danger" onClick={() => setDeleting(c)}>Delete</Button>
            </div>
          )},
        ]}
        rows={filteredCeremonies}
        empty={ceremonies.length === 0 ? "No ceremonies yet" : "No matches for current filters"}
        loading={loading}
      />

      <FormModal<AwardCeremony>
        open={creating || !!editing}
        title={editing ? "Edit Ceremony" : "New Ceremony"}
        fields={ceremonyFields}
        initial={editing ?? { status: "Scheduled" } as any}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={upsertCeremony}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete ceremony?"
        message={`Remove ceremony for race ${deleting?.raceId}?`}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && removeCeremony(deleting)}
      />
      <FormModal
        open={!!editingPrize}
        title={`Edit Prizes — ${editingPrize?.id}`}
        fields={prizeFields}
        initial={editingPrize ? {
          p1_money: editingPrize.prizes[0]?.money, p1_trophy: editingPrize.prizes[0]?.trophy,
          p2_money: editingPrize.prizes[1]?.money, p2_trophy: editingPrize.prizes[1]?.trophy,
          p3_money: editingPrize.prizes[2]?.money, p3_trophy: editingPrize.prizes[2]?.trophy,
        } as any : {}}
        onClose={() => setEditingPrize(null)}
        onSubmit={savePrizes}
      />

      <Modal
        open={!!viewingRaceId}
        onClose={() => setViewingRaceId(null)}
        title={viewingRace ? `Award Ceremony — ${viewingRace.id} · ${viewingRace.track}` : ""}
      >
        {viewingRace && (
          <div className="space-y-4">
            {podium.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No results recorded yet for this race. Ceremony cannot be conducted.
              </div>
            ) : (
              <>
                <div className="text-center text-sm text-muted-foreground">
                  Congratulating top {podium.length} finishers
                </div>
                <div className="grid grid-cols-3 gap-3 items-end">
                  {[2, 1, 3].map(rank => {
                    const r = podium.find(p => p.rank === rank);
                    if (!r) return <div key={rank} />;
                    const horse = getHorse(r.horseId);
                    const jockey = getJockey(r.jockeyId);
                    const owner = horse ? getOwner(horse.ownerId) : null;
                    const prize = viewingRace.prizes.find(p => p.rank === rank);
                    const heights = { 1: "h-44", 2: "h-32", 3: "h-24" } as const;
                    const accents = { 1: "bg-warning/20 border-warning text-warning", 2: "bg-muted border-border text-foreground", 3: "bg-accent border-border text-foreground" } as const;
                    return (
                      <div key={rank} className="flex flex-col items-center">
                        <div className={`flex items-center gap-1 mb-2 ${rank === 1 ? "text-warning" : "text-muted-foreground"}`}>
                          {rank === 1 ? <Crown className="h-5 w-5" /> : <Medal className="h-4 w-4" />}
                          <span className="text-xs font-semibold uppercase">#{rank}</span>
                        </div>
                        <div className="text-center text-sm font-semibold text-foreground">{horse?.name}</div>
                        <div className="text-xs text-muted-foreground text-center">{jockey?.name}</div>
                        <div className="text-xs text-muted-foreground text-center mb-1">Owner: {owner?.name}</div>
                        <div className={`w-full ${heights[rank as 1 | 2 | 3]} ${accents[rank as 1 | 2 | 3]} border rounded-t-lg flex flex-col items-center justify-center p-2`}>
                          <div className="text-xl font-bold">{rank}</div>
                          <div className="text-xs mt-1">${prize?.money.toLocaleString()}</div>
                          <div className="text-[10px] text-center px-1 mt-1 opacity-80">{prize?.trophy}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
