import { Search, X } from "lucide-react";

export type FilterDef = {
  key: string;
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
};

export function TableToolbar({
  search,
  onSearch,
  searchPlaceholder = "Search…",
  filters = [],
  right,
}: {
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  right?: React.ReactNode;
}) {
  const hasActive = !!search || filters.some(f => f.value);
  const clearAll = () => {
    onSearch("");
    filters.forEach(f => f.onChange(""));
  };
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[220px] max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-8 pr-3 py-2 text-sm border border-input rounded-md bg-background"
        />
      </div>
      {filters.map(f => (
        <select
          key={f.key}
          value={f.value}
          onChange={e => f.onChange(e.target.value)}
          className="px-3 py-2 text-sm border border-input rounded-md bg-background"
        >
          <option value="">All {f.label}</option>
          {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
      {hasActive && (
        <button
          onClick={clearAll}
          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      )}
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}
