import { PageHeadSkeleton, GridSkeleton } from "@/components/shell/PageSkeleton";

export default function Loading() {
  return (
    <>
      <PageHeadSkeleton withAction />
      <GridSkeleton count={6} />
    </>
  );
}
