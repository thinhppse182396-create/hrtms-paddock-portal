import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { refereeReports as initial } from "@/data/databaseData";
import { useDatabaseCollection } from "@/hooks/useDatabaseCollection";
import { syncRefereeReport } from "@/lib/backendApi";

export const Route = createFileRoute("/referee/reports")({ component: RefereeReportPage });

function RefereeReportPage() {
  const [data, setData] = useDatabaseCollection("referee:reports", initial);
  const update = async (id: string, status: string) => {
    const report = data.find(item => item.id === id);
    if (!report) return;
    await syncRefereeReport({ ...report, status });
    setData(rows => rows.map(item => item.id === id ? { ...item, status } : item));
  };

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
              {r.status === "Draft" && <Button onClick={() => void update(r.id, "Submitted")}>Submit Report</Button>}
              {r.status === "Submitted" && <Button onClick={() => void update(r.id, "Confirmed")}>Confirm Report</Button>}
              {r.status === "Confirmed" && <Button variant="secondary" disabled>Locked</Button>}
            </div>
          )},
        ]}
        rows={data}
      />
    </div>
  );
}
