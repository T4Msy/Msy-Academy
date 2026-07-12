import { PageHeadSkeleton, StatsSkeleton } from "@/components/shell/PageSkeleton";

export default function Loading() {
  return (
    <>
      <PageHeadSkeleton />
      <StatsSkeleton />
    </>
  );
}
