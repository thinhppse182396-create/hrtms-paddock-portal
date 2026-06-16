import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { FormModal, ConfirmDialog, DetailModal, type Field } from "@/components/common/FormModal";
import { TableToolbar } from "@/components/common/TableToolbar";
// Thay thế mock API bằng axios instance thực tế
import api from "@/api"; 
import { trackHasConflict, type TrackReservation } from "@/lib/racing";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/admin/tournaments")({ component: TournamentManagement });

// Khai báo lại kiểu dữ liệu (trước đó lấy từ seed, giờ ta định nghĩa rõ ràng)
export type Tournament = {
  id: string;
  name: string;
  season: string;
  trackId?: string;
  status: string;
  startDate: string;
  endDate: string;
};

const baseFields: Field[] = [
  { name: "id", label: "ID", required: true, placeholder: "T005" },
  { name: "name", label: "Name", required: true, full: true },
  { name: "season", label: "Season", type: "select", required: true, options: ["Spring", "Summer", "Autumn", "Winter"].map(s => ({ label: s, value: s })) },
  { name: "trackId", label: "Track Reservation", type: "select", required: true, options: [] },
  { name: "status", label: "Status", type: "select", required: true, options: ["Draft", "Open", "Closed", "Completed"].map(s => ({ label: s, value: s })) },
  { name: "startDate", label: "Start date", type: "date", required: true },
  { name: "endDate", label: "End date", type: "date", required: true },
];

function TournamentManagement() {
  // 1. Chuyển sang dùng State tiêu chuẩn
  const [rows, setRows] = useState<Tournament[]>([]);
  const [trackList, setTrackList] = useState<any[]>([]); // Lưu danh sách track lấy từ API
  const [loading, setLoading] = useState<boolean>(true);

  const [editing, setEditing] = useState<Tournament | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Tournament | null>(null);
  const [deleting, setDeleting] = useState<Tournament | null>(null);

  const [q, setQ] = useState("");
  const [season, setSeason] = useState("");
  const [status, setStatus] = useState("");

  // 2. Fetch dữ liệu khi render Component
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Gọi đồng thời 2 API để lấy danh sách giải đấu và danh sách sân (cho dropdown)
        const [tournamentsRes, tracksRes] = await Promise.all([
          api.get('/tournaments'),
          api.get('/tracks')
        ]);
        
        setRows(tournamentsRes.data);
        setTrackList(tracksRes.data);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
        toast.error("Lỗi hệ thống", { description: "Không thể tải danh sách giải đấu hoặc sân đua." });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fields: Field[] = useMemo(() => baseFields.map(f =>
    f.name === "trackId"
      ? { ...f, options: trackList.map(t => ({ label: `${t.id} — ${t.name}`, value: t.id })) }
      : f,
  ), [trackList]);

  const filtered = useMemo(() => rows.filter(r => {
    const m = q.trim().toLowerCase();
    if (m && !`${r.id} ${r.name}`.toLowerCase().includes(m)) return false;
    if (season && r.season !== season) return false;
    if (status && r.status !== status) return false;
    return true;
  }), [rows, q, season, status]);

  // 3. Gọi API POST / PUT để tạo hoặc cập nhật
  const upsert = async (v: Tournament) => {
    const isEdit = rows.some(x => x.id === v.id);
    
    try {
      if (isEdit) {
        await api.put(`/tournaments/${v.id}`, v);
        setRows(r => r.map(x => x.id === v.id ? v : x));
      } else {
        await api.post('/tournaments', v);
        setRows(r => [...r, v]);
      }
      
      setQ(""); setSeason(""); setStatus("");
      setCreating(false); setEditing(null);
      toast.success(isEdit ? "Cập nhật giải đấu thành công" : "Tạo giải đấu thành công", { description: `${v.id} — ${v.name}` });
    } catch (error) {
      console.error("Lỗi khi lưu Tournament:", error);
      toast.error("Lưu thất bại", { description: "Có lỗi xảy ra khi lưu dữ liệu lên server." });
    }
  };

  // 4. Gọi API DELETE để xóa
  const remove = async (t: Tournament) => {
    try {
      await api.delete(`/tournaments/${t.id}`);
      
      setRows(r => r.filter(x => x.id !== t.id));
      setDeleting(null);
      toast.success("Đã xóa giải đấu", { description: `${t.id} — ${t.name}` });
    } catch (error) {
      console.error("Lỗi khi xóa Tournament:", error);
      toast.error("Xóa thất bại", { description: "Không thể xóa giải đấu này." });
    }
  };

  return (
    <div>
      <PageHeader
        title="Tournament Management"
        subtitle="Create and manage racing tournaments"
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New Tournament</Button>}
      />
      <TableToolbar
        search={q} onSearch={setQ} searchPlaceholder="Search by ID or name…"
        filters={[
          { key: "season", label: "Seasons", value: season, onChange: setSeason, options: ["Spring","Summer","Autumn","Winter"].map(s => ({ label: s, value: s })) },
          { key: "status", label: "Statuses", value: status, onChange: setStatus, options: ["Draft","Open","Closed","Completed"].map(s => ({ label: s, value: s })) },
        ]}
      />
      <DataTable
        columns={[
          { key: "id", header: "ID" },
          { key: "name", header: "Name" },
          { key: "season", header: "Season" },
          { key: "trackId", header: "Track", render: r => r.trackId ? <span className="font-mono text-xs">{r.trackId}</span> : <span className="text-xs text-muted-foreground">—</span> },
          { key: "startDate", header: "Start" },
          { key: "endDate", header: "End" },
          { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
          { key: "actions", header: "Actions", render: r => (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setViewing(r)}>View</Button>
              <Button variant="ghost" onClick={() => setEditing(r)}>Edit</Button>
              <Button variant="danger" onClick={() => setDeleting(r)}>Delete</Button>
            </div>
          )},
        ]}
        rows={filtered}
        empty={rows.length === 0 ? "No tournaments yet" : "No matches for current filters"}
        loading={loading}
      />

      <FormModal<Tournament>
        open={creating || !!editing}
        title={editing ? "Edit Tournament" : "Create Tournament"}
        fields={fields}
        initial={editing ?? { id: `T${String(rows.length + 1).padStart(3, "0")}`, status: "Draft" } as any}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={upsert}
        validate={(v) => {
          const e: Record<string, string> = {};
          if (v.startDate && v.endDate && v.startDate > v.endDate) {
            e.endDate = "End date must be on or after start date";
          }
          if (!/^T\d{3,}$/.test(String(v.id || ""))) e.id = "ID must look like T001";
          if (!editing && rows.some(x => x.id === v.id)) e.id = "ID already exists";
          if (v.trackId && v.startDate && v.endDate) {
            const others: TrackReservation[] = rows
              .filter(x => x.id !== v.id && x.trackId && x.startDate && x.endDate)
              .map(x => ({ trackId: x.trackId!, start: x.startDate, end: x.endDate }));
            const conflict = trackHasConflict({ trackId: v.trackId, start: v.startDate, end: v.endDate }, others);
            if (conflict) e.trackId = `Track ${v.trackId} đã được đặt từ ${conflict.start} → ${conflict.end} bởi tournament khác.`;
          }
          
          // LƯU Ý: Đoạn check orphaned races bên dưới yêu cầu biến `races` phải được định nghĩa.
          // Trong API thật, có thể bạn sẽ cần check logic này phía Backend, hoặc fetch thêm danh sách races về để Frontend validate.
          /*
          if (editing && v.startDate && v.endDate && typeof races !== 'undefined') {
            const orphaned = races.filter(r =>
              r.tournamentId === v.id &&
              (r.date < v.startDate || r.date > v.endDate)
            );
            if (orphaned.length > 0) {
              e.endDate = `Cảnh báo: ${orphaned.length} Race đã lên lịch nằm ngoài khoảng ngày mới (${orphaned.map(r => r.id).join(", ")})`;
            }
          }
          */
          
          return Object.keys(e).length ? e : null;
        }}
      />
      <DetailModal
        open={!!viewing}
        title={viewing?.name ?? ""}
        items={viewing ? [
          { label: "ID", value: viewing.id },
          { label: "Season", value: viewing.season },
          { label: "Track", value: viewing.trackId ?? "—" },
          { label: "Start", value: viewing.startDate },
          { label: "End", value: viewing.endDate },
          { label: "Status", value: <StatusBadge status={viewing.status} /> },
        ] : []}
        onClose={() => setViewing(null)}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete tournament?"
        message={`This will permanently remove "${deleting?.name}".`}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting)}
      />
    </div>
  );
}
