import type { ReactNode } from "react";
import { DataTableSkeleton } from "./DataTableSkeleton";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}
export function DataTable<T extends Record<string, any>>({ columns, rows, empty = "No data", loading }: { columns: Column<T>[]; rows: T[]; empty?: string; loading?: boolean }) {
  if (loading) {
    return <DataTableSkeleton columns={columns.length} rows={5} />;
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map(c => (
                <th key={c.key} className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="row-stagger">
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">{empty}</td></tr>
            ) : rows.map((row, idx) => (
              <tr key={row.id ?? `${row.raceId ?? "row"}-${row.horseId ?? row.jockeyId ?? idx}`} className="border-t border-border hover:bg-muted/40 transition-colors">
                {columns.map(c => (
                  <td key={c.key} className="px-4 py-3 text-foreground">
                    {c.render ? c.render(row) : (row[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
