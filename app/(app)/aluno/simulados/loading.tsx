import { PageHeadSkeleton, GridSkeleton } from "@/components/shell/PageSkeleton";

export default function Loading() {
  return (
    <>
      <PageHeadSkeleton />
      <GridSkeleton count={6} />
    </>
  );
}
