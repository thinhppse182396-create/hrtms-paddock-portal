import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FormModal, ConfirmDialog, type Field } from "@/components/common/FormModal";
import { TableToolbar } from "@/components/common/TableToolbar";
import { useDatabaseCollection } from "@/hooks/useDatabaseCollection";
import { systemUsers } from "@/data/databaseData";
import { Plus } from "lucide-react";
import { deleteUser, resetUserPassword, syncUser, updateUserStatus } from "@/lib/backendApi";

export const Route = createFileRoute("/admin/users")({ component: UserManagement });

type User = (typeof systemUsers)[number] & { password?: string };
type ResetPasswordForm = { adminPassword: string; newPassword: string; confirmPassword: string };

const fields: Field[] = [
  { name: "id", label: "ID", required: true },
  { name: "username", label: "Username", required: true },
  { name: "password", label: "Initial password", type: "password" },
  { name: "name", label: "Full name", required: true, full: true },
  { name: "role", label: "Role", type: "select", required: true, options: ["ADMIN", "REFEREE", "OWNER", "JOCKEY", "SPECTATOR"].map(r => ({ label: r, value: r })) },
  { name: "status", label: "Status", type: "select", required: true, options: ["Active", "Locked"].map(s => ({ label: s, value: s })) },
];

const resetPasswordFields: Field[] = [
  { name: "adminPassword", label: "Your admin password", type: "password", required: true, full: true },
  { name: "newPassword", label: "New password", type: "password", required: true, full: true },
  { name: "confirmPassword", label: "Confirm password", type: "password", required: true, full: true },
];

function UserManagement() {
  const { currentUser } = useAuth();
  const [rows, setRows, loading] = useDatabaseCollection<User>("admin:users", systemUsers);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);

  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const filtered = useMemo(() => rows.filter(r => {
    const m = q.trim().toLowerCase();
    if (m && !`${r.id} ${r.username} ${r.name}`.toLowerCase().includes(m)) return false;
    if (role && r.role !== role) return false;
    if (status && r.status !== status) return false;
    return true;
  }), [rows, q, role, status]);

  const toggle = async (u: User) => {
    await updateUserStatus(u.id, u.status === "Active" ? "Locked" : "Active");
    setRows(d => d.map(x => x.id === u.id ? { ...x, status: x.status === "Active" ? "Locked" : "Active" } : x));
    toast.success(u.status === "Active" ? "User locked" : "User unlocked", { description: `${u.username}` });
  };
  const upsert = async (v: User) => {
    const isEdit = rows.some(x => x.id === v.id);
    await syncUser(v, isEdit);
    setRows(r => isEdit ? r.map(x => x.id === v.id ? v : x) : [...r, v]);
    setQ(""); setRole(""); setStatus("");
    setCreating(false); setEditing(null);
    toast.success(isEdit ? "User updated" : "User created", { description: `${v.username} • ${v.role}` });
  };
  const remove = async (u: User) => {
    await deleteUser(u.id);
    setRows(r => r.filter(x => x.id !== u.id));
    setDeleting(null);
    toast.success("User deleted", { description: `${u.username}` });
  };
  const resetPassword = async (values: ResetPasswordForm) => {
    if (!resetting || !currentUser) return;
    await resetUserPassword(resetting.id, currentUser.accountId, values.adminPassword, values.newPassword);
    toast.success("Password reset", { description: resetting.username });
    setResetting(null);
  };

  return (
    <div>
      <PageHeader
        title="User & Role Management"
        subtitle="Create users and assign roles"
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New User</Button>}
      />
      <TableToolbar
        search={q} onSearch={setQ} searchPlaceholder="Search by ID, username or name…"
        filters={[
          { key: "role", label: "Roles", value: role, onChange: setRole, options: ["ADMIN","REFEREE","OWNER","JOCKEY","SPECTATOR"].map(s => ({ label: s, value: s })) },
          { key: "status", label: "Statuses", value: status, onChange: setStatus, options: ["Active","Locked"].map(s => ({ label: s, value: s })) },
        ]}
      />
      <DataTable
        columns={[
          { key: "id", header: "ID" },
          { key: "username", header: "Username" },
          { key: "name", header: "Name" },
          { key: "role", header: "Role" },
          { key: "status", header: "Status", render: r => <StatusBadge status={r.status} /> },
          { key: "actions", header: "Actions", render: r => (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditing(r)}>Edit</Button>
              <Button variant="ghost" onClick={() => setResetting(r)}>Reset password</Button>
              <Button variant={r.status === "Active" ? "danger" : "primary"} onClick={() => void toggle(r)}>
                {r.status === "Active" ? "Lock" : "Unlock"}
              </Button>
              <Button variant="danger" onClick={() => setDeleting(r)}>Delete</Button>
            </div>
          )},
        ]}
        rows={filtered}
        empty={rows.length === 0 ? "No users yet" : "No matches for current filters"}
        loading={loading}
      />

      <FormModal<User>
        open={creating || !!editing}
        title={editing ? "Edit User" : "Create User"}
        fields={fields}
        initial={editing ?? { id: `U${String(rows.length + 1).padStart(3, "0")}`, status: "Active", role: "OWNER" } as any}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={upsert}
        validate={(v) => {
          const e: Record<string, string> = {};
          if (!editing && rows.some(x => x.id === v.id)) e.id = "ID already exists";
          if (rows.some(x => x.username === v.username && x.id !== v.id)) e.username = "Username already taken";
          if (!editing && String(v.password ?? "").length < 6) e.password = "Initial password must contain at least 6 characters";
          return Object.keys(e).length ? e : null;
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete user?"
        message={`Remove ${deleting?.name} (${deleting?.username}) permanently?`}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && void remove(deleting)}
      />
      <FormModal<ResetPasswordForm>
        open={!!resetting}
        title={`Reset password - ${resetting?.username ?? ""}`}
        fields={resetPasswordFields}
        onClose={() => setResetting(null)}
        onSubmit={resetPassword}
        submitLabel="Reset password"
        validate={(values) => {
          const errors: Record<string, string> = {};
          if (values.newPassword.length < 6) errors.newPassword = "Password must contain at least 6 characters";
          if (values.confirmPassword !== values.newPassword) errors.confirmPassword = "Passwords do not match";
          return Object.keys(errors).length ? errors : null;
        }}
      />
    </div>
  );
}
