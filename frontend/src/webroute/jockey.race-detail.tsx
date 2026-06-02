import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { jockeyInvitations, races, horses, registrations, refereeAssignments, getHorse, getOwner, getJockey, getReferee, getTournament } from "@/data/mockData";

export const Route = createFileRoute("/jockey/race-detail")({ component: RaceDetail });

function RaceDetail() {
  const myJockeyId = "J001";
  const myAccepted = jockeyInvitations.find(i => i.jockeyId === myJockeyId && i.status === "Accepted");
  const race = myAccepted ? races.find(r => r.id === myAccepted.raceId) : null;
  const horse = myAccepted ? getHorse(myAccepted.horseId) : null;
  const opponents = race ? registrations.filter(r => r.raceId === race.id && r.status === "Approved" && r.jockeyId !== myJockeyId) : [];
  const refId = race ? refereeAssignments.find(a => a.raceId === race.id)?.refereeId : undefined;

  if (!race) return <div><PageHeader title="Race Detail" /><p className="text-muted-foreground">No assigned race.</p></div>;

  return (
    <div>
      <PageHeader title="Race Detail" subtitle={`${race.id} · ${getTournament(race.tournamentId)?.name}`} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-3">Race Info</h3>
          <dl className="text-sm space-y-1.5">
            <div className="flex justify-between"><dt className="text-muted-foreground">Date</dt><dd>{race.date} {race.time}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Track</dt><dd>{race.track}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Distance</dt><dd>{race.distance}m</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Lanes</dt><dd>{race.lanes}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd><StatusBadge status={race.status} /></dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Referee</dt><dd>{refId ? getReferee(refId)?.name : "—"}</dd></div>
          </dl>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-3">Your Horse</h3>
          {horse ? (
            <dl className="text-sm space-y-1.5">
              <div className="flex justify-between"><dt className="text-muted-foreground">Name</dt><dd>{horse.name}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Breed</dt><dd>{horse.breed}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Age</dt><dd>{horse.age}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Weight</dt><dd>{horse.weight} kg</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Owner</dt><dd>{getOwner(horse.ownerId)?.name}</dd></div>
            </dl>
          ) : <p className="text-muted-foreground text-sm">No horse assigned</p>}
        </div>
      </div>

      <h3 className="text-sm font-semibold mb-3">Opponents</h3>
      <DataTable
        columns={[
          { key: "horse", header: "Horse", render: r => getHorse(r.horseId)?.name },
          { key: "jockey", header: "Jockey", render: r => getJockey(r.jockeyId)?.name },
          { key: "owner", header: "Owner", render: r => getOwner(r.ownerId)?.name },
        ]}
        rows={opponents}
      />
    </div>
  );
}
