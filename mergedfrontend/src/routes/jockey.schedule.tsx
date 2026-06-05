import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { jockeyInvitations, races, getHorse, getOwner, getTournament } from "@/data/mockData";

export const Route = createFileRoute("/jockey/schedule")({ component: MyRaceSchedule });

function MyRaceSchedule() {
  const myJockeyId = "J001";
  const accepted = jockeyInvitations.filter(i => i.jockeyId === myJockeyId && i.status === "Accepted");
  const rows = accepted.map(a => {
    const race = races.find(r => r.id === a.raceId);
    return { ...a, race };
  });

  return (
    <div>
      <PageHeader title="My Race Schedule" subtitle="Upcoming and past races you are riding in" />
      <DataTable
        columns={[
          { key: "raceId", header: "Race" },
          { key: "tournament", header: "Tournament", render: r => r.race ? getTournament(r.race.tournamentId)?.name : "—" },
          { key: "horse", header: "Horse", render: r => getHorse(r.horseId)?.name },
          { key: "owner", header: "Owner", render: r => getOwner(r.ownerId)?.name },
          { key: "date", header: "Date", render: r => r.race ? `${r.race.date} ${r.race.time}` : "—" },
          { key: "track", header: "Track", render: r => r.race?.track },
          { key: "distance", header: "Distance", render: r => r.race ? `${r.race.distance}m` : "—" },
          { key: "status", header: "Status", render: r => r.race ? <StatusBadge status={r.race.status} /> : "—" },
        ]}
        rows={rows}
      />
    </div>
  );
}
