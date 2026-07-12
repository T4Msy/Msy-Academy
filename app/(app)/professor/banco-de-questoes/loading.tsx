import { PageHeadSkeleton, CardListSkeleton } from "@/components/shell/PageSkeleton";

export default function Loading() {
  return (
    <>
      <PageHeadSkeleton />
      <CardListSkeleton count={5} rows={2} />
    </>
  );
}
