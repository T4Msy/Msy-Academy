import { PageHeadSkeleton, CardListSkeleton } from "@/components/shell/PageSkeleton";

export default function Loading() {
  return (
    <>
      <PageHeadSkeleton />
      <CardListSkeleton count={3} rows={4} />
    </>
  );
}
