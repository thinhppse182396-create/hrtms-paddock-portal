import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";

export const Route = createFileRoute("/admin/pending-approvals")({ component: PendingApprovalsPage });

function PendingApprovalsPage() {
  return (
    <div>
      <PageHeader
        title="Pending Account Approvals"
        subtitle="Public staff self-registration is disabled. Create staff accounts directly in User Management."
      />
      <Link to="/admin/users"><Button>Open User Management</Button></Link>
    </div>
  );
}
