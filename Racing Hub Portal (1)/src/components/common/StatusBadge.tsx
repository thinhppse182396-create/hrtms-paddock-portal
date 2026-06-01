type StatusType = "success" | "warning" | "danger" | "info" | "neutral";

const statusMap: Record<string, StatusType> = {
  Approved: "success", Completed: "success", Confirmed: "success", Accepted: "success", Active: "success", Eligible: "success", Open: "success", Published: "success",
  Pending: "warning", Draft: "warning", Scheduled: "warning", Waiting: "warning", Closed: "warning",
  Rejected: "danger", Cancelled: "danger", Disqualified: "danger", Declined: "danger", Suspended: "danger", Ineligible: "danger", Locked: "danger",
  Ongoing: "info", Submitted: "info", Retired: "neutral", Inactive: "neutral",
};

const classes: Record<StatusType, string> = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  info: "bg-info/10 text-info border-info/20",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: string }) {
  const type = statusMap[status] ?? "neutral";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes[type]}`}>
      {status}
    </span>
  );
}
