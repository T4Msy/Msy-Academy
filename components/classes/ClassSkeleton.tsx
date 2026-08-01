import { Skeleton } from "@/components/ui/skeleton";

export function OverviewSkeleton() {
  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-[112px] rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-52 rounded-lg" />
        <Skeleton className="h-52 rounded-lg" />
      </div>
    </>
  );
}

export function ListSkeleton() {
  return <Skeleton className="h-80 rounded-lg" />;
}
