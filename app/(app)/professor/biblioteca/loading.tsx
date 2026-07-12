import { PageHeadSkeleton, CardListSkeleton } from "@/components/shell/PageSkeleton";

export default function Loading() {
  return (
    <>
      <PageHeadSkeleton withAction />
      <CardListSkeleton count={5} rows={1} />
    </>
  );
}
