import { Skeleton } from "@/components/ui/skeleton";

export function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex items-start justify-between">
      <div className="w-full">
        <Skeleton className="h-3 w-20 mb-3" />
        <Skeleton className="h-8 w-12" />
      </div>
      <Skeleton className="h-9 w-9 rounded-md shrink-0" />
    </div>
  );
}
