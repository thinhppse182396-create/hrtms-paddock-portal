import { createFileRoute } from "@tanstack/react-router";
import { Rabbit, ClipboardList, Flag, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { horses, registrations, races, raceResults, getHorse } from "@/data/mockData";

export const Route = createFileRoute("/owner/dashboard")({ component: OwnerDashboard });

function OwnerDashboard() {
  const myOwnerId = "O001";
  const myHorses = horses.filter(h => h.ownerId === myOwnerId);
  const eligible = myHorses.filter(h => h.status === "Eligible").length;
  const myRegs = registrations.filter(r => r.ownerId === myOwnerId);
  const upcoming = races.filter(r => r.status === "Scheduled");
  const recentResults = raceResults.filter(r => myHorses.some(h => h.id === r.horseId));
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + 7);
  const expiringSoon = myHorses.filter(h => new Date(h.healthCertExpiry) <= cutoff);

  return (
    <div>
      <PageHeader title="Owner Dashboard" subtitle="Track your stable and race registrations" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="My Horses" value={myHorses.length} icon={<Rabbit className="h-5 w-5" />} />
        <StatCard label="Eligible to Race" value={eligible} icon={<Flag className="h-5 w-5" />} />
        <StatCard label="Pending Registrations" value={myRegs.filter(r => r.status === "Pending").length} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="Approved" value={myRegs.filter(r => r.status === "Approved").length} icon={<Flag className="h-5 w-5" />} />
      </div>

      {expiringSoon.length > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-foreground">Stable alerts</div>
            <div className="text-muted-foreground">
              Health certificate expiring within 7 days: {expiringSoon.map(h => `${h.name} (${h.healthCertExpiry})`).join(", ")}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Upcoming Races</h2>
          <DataTable
            columns={[
              { key: "id", header: "Race" },
              { key: "date", header: "Date" },
              { key: "track", header: "Track" },
              { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
            ]}
            rows={upcoming}
          />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Recent Results</h2>
          <DataTable
            columns={[
              { key: "horse", header: "Horse", render: r => getHorse(r.horseId)?.name },
              { key: "raceId", header: "Race" },
              { key: "rank", header: "Rank" },
              { key: "finishTime", header: "Time" },
            ]}
            rows={recentResults}
          />
        </div>
      </div>
    </div>
  );
}
