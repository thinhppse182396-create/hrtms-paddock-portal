import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";

export const Route = createFileRoute("/referee/reports")({ component: RefereeReportPage });

function RefereeReportPage() {
  const [data, setData] = useState(initial);
  const update = (id: string, status: string) => setData(d => d.map(r => r.id === id ? { ...r, status } : r));

  return (
    <div>
      <PageHeader title="Referee Reports" subtitle="Submit and confirm race reports" />
      <DataTable
        columns={[
          { key: "id", header: "Report ID" },
          { key: "raceId", header: "Race" },
          { key: "notes", header: "Notes", render: r => r.notes || <span className="text-muted-foreground">—</span> },
          { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
          { key: "actions", header: "Actions", render: r => (
            <div className="flex gap-2">
              {r.status === "Draft" && <Button onClick={() => update(r.id, "Submitted")}>Submit Report</Button>}
              {r.status === "Submitted" && <Button onClick={() => update(r.id, "Confirmed")}>Confirm Report</Button>}
              {r.status === "Confirmed" && <Button variant="secondary" disabled>Locked</Button>}
            </div>
          )},
        ]}
        rows={data}
      />
    </div>
  );
}
