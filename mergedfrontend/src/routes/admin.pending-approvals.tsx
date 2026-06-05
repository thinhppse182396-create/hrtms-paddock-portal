import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";

export const Route = createFileRoute("/admin/pending-approvals")({ component: PendingApprovalsPage });

interface PendingAccount {
  username: string;
  name: string;
  role: "JOCKEY" | "REFEREE";
  licenseNo?: string;
  experience?: string;
  status: "Pending" | "Approved" | "Rejected";
  submittedAt: string;
}

const KEY = "pendingAccounts";

function load(): PendingAccount[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(list: PendingAccount[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function PendingApprovalsPage() {
  const [rows, setRows] = useState<PendingAccount[]>([]);
  useEffect(() => { setRows(load()); }, []);

  const update = (username: string, status: PendingAccount["status"]) => {
    const next = rows.map(r => r.username === username ? { ...r, status } : r);
    setRows(next); save(next);
    toast.success(status === "Approved" ? "Đã duyệt tài khoản" : "Đã từ chối", { description: username });
  };

  return (
    <div>
      <PageHeader
        title="Pending Account Approvals"
        subtitle="Self-registered Jockey & Referee — Admin duyệt để kích hoạt (CF6 catalogue)."
      />
      <DataTable
        columns={[
          { key: "submittedAt", header: "Submitted" },
          { key: "username", header: "Username" },
          { key: "name", header: "Full name" },
          { key: "role", header: "Role" },
          { key: "licenseNo", header: "License" },
          { key: "experience", header: "Experience" },
          { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
          { key: "actions", header: "Actions", render: r => r.status === "Pending" ? (
            <div className="flex gap-2">
              <Button onClick={() => update(r.username, "Approved")}>Approve</Button>
              <Button variant="danger" onClick={() => update(r.username, "Rejected")}>Reject</Button>
            </div>
          ) : <span className="text-xs text-muted-foreground">—</span> },
        ]}
        rows={rows}
        empty="Chưa có yêu cầu nào — Jockey/Referee có thể tự đăng ký tại trang Sign up."
      />
    </div>
  );
}
