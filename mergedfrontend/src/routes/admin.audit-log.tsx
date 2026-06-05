import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAuditLog } from "@/lib/auditLog";

export const Route = createFileRoute("/admin/audit-log")({ component: AuditLogPage });

function AuditLogPage() {
  const entries = useAuditLog();
  const [q, setQ] = useState("");
  const filtered = entries.filter(e =>
    !q || [e.actor, e.action, e.target, e.details ?? ""].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Immutable trail of all referee and admin actions" />
      <div className="mb-4">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by actor, action, target…"
          className="w-full max-w-md px-3 py-2 border border-input rounded-md bg-background text-sm"
        />
      </div>
      <DataTable
        columns={[
          { key: "at", header: "Timestamp" },
          { key: "actor", header: "Actor" },
          { key: "action", header: "Action", render: r => <StatusBadge status={r.action} /> },
          { key: "target", header: "Target" },
          { key: "details", header: "Details", render: r => r.details ?? "—" },
        ]}
        rows={filtered}
      />
    </div>
  );
}
