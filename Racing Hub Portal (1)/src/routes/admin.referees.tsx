import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/common/Button";
import { DataTable } from "@/components/common/DataTable";
import { FormModal, ConfirmDialog, type Field } from "@/components/common/FormModal";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TableToolbar } from "@/components/common/TableToolbar";
import { races, refereeAssignments as initialAssignments, referees as initialReferees, systemUsers } from "@/data/databaseData";
import { useDatabaseCollection } from "@/hooks/useDatabaseCollection";
import { deleteReferee, syncReferee } from "@/lib/backendApi";

export const Route = createFileRoute("/admin/referees")({ component: RefereeAssignment });

type Referee = (typeof initialReferees)[number];
type Assignment = (typeof initialAssignments)[number];

function RefereeAssignment() {
  const [referees, setReferees, refereesLoading] = useDatabaseCollection<Referee>("admin:referees", initialReferees);
  const [assignments, , assignmentsLoading] = useDatabaseCollection<Assignment>("admin:refereeAssignments", initialAssignments);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Referee | null>(null);
  const [deleting, setDeleting] = useState<Referee | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [raceQuery, setRaceQuery] = useState("");
  const [raceStatus, setRaceStatus] = useState("");

  const refereeAccounts = systemUsers.filter(user => user.role === "REFEREE");
  const fields: Field[] = [
    { name: "id", label: "ID", required: true },
    {
      name: "accountId",
      label: "Referee account",
      type: "select",
      required: true,
      full: true,
      options: refereeAccounts.map(account => ({ label: `${account.name} (${account.username})`, value: account.id })),
    },
    { name: "name", label: "Name", required: true, full: true },
    { name: "licenseNo", label: "License No", required: true },
  ];

  const visibleReferees = useMemo(() => referees.filter(referee => {
    const search = query.trim().toLowerCase();
    if (search && !`${referee.id} ${referee.name} ${referee.licenseNo}`.toLowerCase().includes(search)) return false;
    return !status || referee.status === status;
  }), [query, referees, status]);

  const visibleRaces = useMemo(() => races.filter(race => {
    const search = raceQuery.trim().toLowerCase();
    if (search && !`${race.id} ${race.track}`.toLowerCase().includes(search)) return false;
    return !raceStatus || race.status === raceStatus;
  }), [raceQuery, raceStatus]);

  const upsertReferee = async (referee: Referee) => {
    const isEdit = Boolean(editing);
    await syncReferee(referee, isEdit);
    setReferees(current => isEdit
      ? current.map(item => item.id === referee.id ? referee : item)
      : [...current, referee]);
    setCreating(false);
    setEditing(null);
    toast.success(isEdit ? "Referee updated" : "Referee created", { description: referee.name });
  };

  const removeReferee = async (referee: Referee) => {
    try {
      await deleteReferee(referee.id);
      setReferees(current => current.filter(item => item.id !== referee.id));
      setDeleting(null);
      toast.success("Referee deleted", { description: referee.name });
    } catch (error: any) {
      toast.error("Cannot delete referee", { description: error?.message });
    }
  };

  return (
    <div>
      <PageHeader
        title="Referee Assignment"
        subtitle="Manage referee profiles and configure race panels"
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New Referee</Button>}
      />

      <h2 className="mb-3 text-sm font-semibold text-foreground">Referees</h2>
      <TableToolbar
        search={query}
        onSearch={setQuery}
        searchPlaceholder="Search by name or license..."
        filters={[
          { key: "status", label: "Statuses", value: status, onChange: setStatus, options: ["Active", "Inactive"].map(value => ({ label: value, value })) },
        ]}
      />
      <div className="mb-6">
        <DataTable
          columns={[
            { key: "id", header: "ID" },
            { key: "name", header: "Name" },
            { key: "licenseNo", header: "License No" },
            { key: "status", header: "Status", render: referee => <StatusBadge status={referee.status} /> },
            { key: "actions", header: "Actions", render: referee => (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setEditing(referee)}>Edit</Button>
                <Button variant="danger" onClick={() => setDeleting(referee)}>Delete</Button>
              </div>
            ) },
          ]}
          rows={visibleReferees}
          empty={referees.length === 0 ? "No referees yet" : "No matches"}
          loading={refereesLoading || assignmentsLoading}
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-foreground">Race Panels</h2>
      <TableToolbar
        search={raceQuery}
        onSearch={setRaceQuery}
        searchPlaceholder="Search races by ID or track..."
        filters={[
          { key: "status", label: "Statuses", value: raceStatus, onChange: setRaceStatus, options: ["Scheduled", "Ongoing", "Completed", "Cancelled"].map(value => ({ label: value, value })) },
        ]}
      />
      <DataTable
        columns={[
          { key: "id", header: "Race" },
          { key: "date", header: "Date" },
          { key: "track", header: "Track" },
          { key: "status", header: "Status", render: race => <StatusBadge status={race.status} /> },
          { key: "panel", header: "Panel", render: race => {
            const names = assignments
              .filter(assignment => assignment.raceId === race.id)
              .map(assignment => referees.find(referee => referee.id === assignment.refereeId)?.name ?? assignment.refereeId);
            return names.length > 0 ? names.join(", ") : <span className="text-warning">Unassigned</span>;
          } },
          { key: "actions", header: "Actions", render: race => (
            <Link to="/admin/race-control/$raceId" params={{ raceId: race.id }}>
              <Button>{assignments.some(assignment => assignment.raceId === race.id) ? "Configure panel" : "Assign panel"}</Button>
            </Link>
          ) },
        ]}
        rows={visibleRaces}
        empty="No matches"
        loading={refereesLoading || assignmentsLoading}
      />

      <FormModal<Referee>
        open={creating || Boolean(editing)}
        title={editing ? "Edit Referee" : "New Referee"}
        fields={fields}
        initial={editing ?? { id: `RF${String(referees.length + 1).padStart(3, "0")}`, status: "Active" } as Partial<Referee>}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={upsertReferee}
        validate={referee => {
          const errors: Record<string, string> = {};
          if (editing && referee.id !== editing.id) errors.id = "ID cannot be changed";
          if (!editing && referees.some(item => item.id === referee.id)) errors.id = "ID already exists";
          if (referees.some(item => item.licenseNo === referee.licenseNo && item.id !== referee.id)) errors.licenseNo = "License No already used";
          if (referees.some(item => item.accountId === referee.accountId && item.id !== referee.id)) errors.accountId = "Account already assigned";
          return Object.keys(errors).length > 0 ? errors : null;
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete referee?"
        message={`Remove ${deleting?.name}? Assigned referees must be removed from race panels first.`}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) void removeReferee(deleting); }}
      />
    </div>
  );
}
