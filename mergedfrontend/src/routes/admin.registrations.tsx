import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { FormModal, ConfirmDialog, DetailModal, type Field } from "@/components/common/FormModal";
import { TableToolbar } from "@/components/common/TableToolbar";
import { Plus } from "lucide-react";

// Import axios instance để gọi API thật
import api from "@/api"; 

export const Route = createFileRoute("/admin/registrations")({ component: RegistrationManagement });

// Định nghĩa kiểu dữ liệu cho Registration
type Reg = {
  id: string;
  raceId: string;
  horseId: string;
  jockeyId: string;
  ownerId: string;
  submittedAt: string;
  status: string;
  reason?: string;
};

function RegistrationManagement() {
  // 1. Dùng State tiêu chuẩn thay vì usePersistentCollection mock
  const [rows, setRows] = useState<Reg[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Reg | null>(null);
  const [viewing, setViewing] = useState<Reg | null>(null);
  const [deleting, setDeleting] = useState<Reg | null>(null);

  const [q, setQ] = useState("");
  const [race, setRace] = useState("");
  const [status, setStatus] = useState("");

  // 2. Lấy danh sách đăng ký từ Server khi vào trang
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true);
        const res = await api.get('/registrations');
        setRows(res.data);
      } catch (error) {
        console.error("Lỗi khi tải đơn đăng ký:", error);
        toast.error("Lỗi hệ thống", { description: "Không thể tải danh sách đơn đăng ký." });
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrations();
  }, []);

  const filtered = useMemo(() => rows.filter(r => {
    const m = q.trim().toLowerCase();
    if (m) {
      // Lưu ý: Các hàm getHorse, getJockey... cần được import hoặc xử lý để lấy tên thật
      const hay = `${r.id} ${r.raceId} ${r.horseId} ${r.jockeyId} ${r.ownerId}`.toLowerCase();
      if (!hay.includes(m)) return false;
    }
    if (race && r.raceId !== race) return false;
    if (status && r.status !== status) return false;
    return true;
  }), [rows, q, race, status]);

  // =====================================================================
  // 🚀 LOGIC DUYỆT ĐƠN (GỌI API PATCH)
  // =====================================================================
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      // BƯỚC 1: Báo cho Server biết trạng thái mới
      // Giả định backend của bạn thiết kế endpoint là PATCH /registrations/{id}/status
      await api.patch(`/registrations/${id}/status`, { status: newStatus });

      // BƯỚC 2: Server OK rồi thì cập nhật ngay trên giao diện UI
      setRows(d => d.map(r => r.id === id ? { ...r, status: newStatus } : r));
      toast.success(`Đã cập nhật trạng thái thành ${newStatus}`, { description: `Mã đơn: ${id}` });
      
    } catch (error) {
      console.error("Lỗi khi duyệt đơn:", error);
      toast.error("Cập nhật thất bại", { description: "Vui lòng thử lại sau." });
    }
  };

  // 3. Gọi API POST / PUT cho việc tạo/sửa tay (nếu Admin tự tạo đơn)
  const upsert = async (v: Reg) => {
    const isEdit = rows.some(x => x.id === v.id);
    
    try {
      if (isEdit) {
        await api.put(`/registrations/${v.id}`, v);
        setRows(r => r.map(x => x.id === v.id ? v : x));
      } else {
        await api.post('/registrations', v);
        setRows(r => [...r, v]);
      }
      
      setQ(""); setRace(""); setStatus("");
      setCreating(false); setEditing(null);
      toast.success(isEdit ? "Cập nhật đơn thành công" : "Tạo đơn thành công", { description: `${v.id} • ${v.raceId}` });
    } catch (error) {
      console.error("Lỗi lưu đơn:", error);
      toast.error("Lỗi hệ thống", { description: "Không thể lưu thông tin đơn đăng ký." });
    }
  };

  // 4. Gọi API DELETE để xóa đơn
  const remove = async (r: Reg) => {
    try {
      await api.delete(`/registrations/${r.id}`);
      
      setRows(d => d.filter(x => x.id !== r.id));
      setDeleting(null);
      toast.success("Đã xóa đơn đăng ký", { description: r.id });
    } catch (error) {
      console.error("Lỗi xóa đơn:", error);
      toast.error("Xóa thất bại", { description: "Không thể xóa đơn này khỏi hệ thống." });
    }
  };

  // LƯU Ý: Biến fields cần dữ liệu danh sách races, horses, jockeys, owners để tạo Dropdown.
  // Bạn có thể import chúng từ file constants/context, hoặc fetch từ API tương tự cách làm ở màn Tournaments.
  // Tạm thời tôi mock rỗng mảng options để tránh lỗi undefined khi chưa có dữ liệu thật.
  const fields: Field[] = [
    { name: "id", label: "ID", required: true },
    { name: "raceId", label: "Race", type: "select", required: true, options: [] }, // Cần truyền mảng races vào đây
    { name: "horseId", label: "Horse", type: "select", required: true, options: [] }, // Cần truyền mảng horses vào đây
    { name: "jockeyId", label: "Jockey", type: "select", required: true, options: [] }, // Cần truyền mảng jockeys vào đây
    { name: "ownerId", label: "Owner", type: "select", required: true, options: [] }, // Cần truyền mảng owners vào đây
    { name: "submittedAt", label: "Submitted", type: "date", required: true },
    { name: "status", label: "Status", type: "select", required: true, options: ["Pending", "Approved", "Rejected", "Cancelled"].map(s => ({ label: s, value: s })) },
    { name: "reason", label: "Note / reason", type: "textarea" },
  ];

  return (
    <div>
      <PageHeader title="Registration Management" subtitle="Approve or reject race registrations"
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New Registration</Button>} />
      <TableToolbar
        search={q} onSearch={setQ} searchPlaceholder="Search by ID, horse, jockey or owner…"
        filters={[
          { key: "race", label: "Races", value: race, onChange: setRace, options: [] }, // Thay [] bằng mảng races map
          { key: "status", label: "Statuses", value: status, onChange: setStatus, options: ["Pending","Approved","Rejected","Cancelled"].map(s => ({ label: s, value: s })) },
        ]}
      />
      <DataTable
        columns={[
          { key: "id", header: "ID" },
          { key: "raceId", header: "Race" },
          { key: "horse", header: "Horse", render: r => r.horseId }, // Tạm hiển thị ID, nếu có hàm getHorse thì bọc vào
          { key: "jockey", header: "Jockey", render: r => r.jockeyId },
          { key: "owner", header: "Owner", render: r => r.ownerId },
          { key: "submittedAt", header: "Submitted" },
          { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
          { key: "actions", header: "Actions", render: r => (
            <div className="flex flex-wrap gap-2">
              {r.status === "Pending" && (
                <>
                  {/* Bấm duyệt gọi updateStatus với "Approved" */}
                  <Button onClick={() => updateStatus(r.id, "Approved")}>Approve</Button>
                  
                  {/* Bấm từ chối gọi updateStatus với "Rejected" */}
                  <Button variant="danger" onClick={() => updateStatus(r.id, "Rejected")}>Reject</Button>
                </>
              )}
              <Button variant="secondary" onClick={() => setViewing(r)}>View</Button>
              <Button variant="ghost" onClick={() => setEditing(r)}>Edit</Button>
              <Button variant="danger" onClick={() => setDeleting(r)}>Delete</Button>
            </div>
          )},
        ]}
        rows={filtered}
        empty={rows.length === 0 ? "No registrations yet" : "No matches for current filters"}
        loading={loading}
      />

      <FormModal<Reg>
        open={creating || !!editing}
        title={editing ? "Edit Registration" : "New Registration"}
        fields={fields}
        initial={editing ?? { id: `RG${String(rows.length + 1).padStart(3, "0")}`, status: "Pending", submittedAt: new Date().toISOString().slice(0, 10) } as any}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={upsert}
        validate={(v) => {
          const e: Record<string, string> = {};
          if (!editing && rows.some(x => x.id === v.id)) e.id = "ID already exists";
          const dup = rows.find(x => x.raceId === v.raceId && x.horseId === v.horseId && x.id !== v.id && x.status !== "Rejected" && x.status !== "Cancelled");
          if (dup) e._form = `Horse already registered in ${v.raceId} (${dup.id})`;
          return Object.keys(e).length ? e : null;
        }}
      />
      <DetailModal
        open={!!viewing}
        title={viewing ? `Registration ${viewing.id}` : ""}
        items={viewing ? [
          { label: "Race", value: viewing.raceId },
          { label: "Horse", value: viewing.horseId },
          { label: "Jockey", value: viewing.jockeyId },
          { label: "Owner", value: viewing.ownerId },
          { label: "Submitted", value: viewing.submittedAt },
          { label: "Status", value: <StatusBadge status={viewing.status} /> },
          { label: "Note", value: viewing.reason },
        ] : []}
        onClose={() => setViewing(null)}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete registration?"
        message={`Remove registration ${deleting?.id}?`}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting)}
      />
    </div>
  );
}
