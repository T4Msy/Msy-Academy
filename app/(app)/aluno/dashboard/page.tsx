import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query/client";
import { studentDashboardStatsQueryKey } from "@/lib/dashboard/queryKeys";
import { getStudentDashboardStats } from "@/lib/dashboard/studentStats";
import { DashboardContent } from "./DashboardContent";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Meu Progresso" };

export default async function AlunoDashboardPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({ queryKey: studentDashboardStatsQueryKey, queryFn: getStudentDashboardStats });

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Meu Progresso</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Sua evolu\u00e7\u00e3o, desempenho e metas.</p>
        </div>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}><DashboardContent /></HydrationBoundary>
    </>
  );
}
