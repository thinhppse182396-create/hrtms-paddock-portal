import type { ReactNode } from "react";

export function StatCard({ label, value, icon, hint }: { label: string; value: ReactNode; icon?: ReactNode; hint?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex items-start justify-between transition-colors hover:border-border/80">
      <div>
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-semibold text-foreground mt-2 tabular-nums">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </div>
      {icon && (
        <div className="h-9 w-9 rounded-md bg-muted text-muted-foreground flex items-center justify-center">
          {icon}
        </div>
      )}
    </div>
  );
}
