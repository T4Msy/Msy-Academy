import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query/client";
import { classStatsQueryKey } from "@/hooks/useClassStats";
import { getProfessorClassStats } from "@/lib/dashboard/classStats";
import { DashboardContent } from "./DashboardContent";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Desempenho das Turmas" };

/**
 * Página PILOTO do padrão de dados da plataforma (decisão nº 5 do ADR):
 * o Server Component faz prefetch com o client Supabase autenticado (RLS),
 * desidrata o cache e o client component (useClassStats) hidrata sem flash
 * de loading. Mutações futuras invalidam `classStatsQueryKey`.
 */
export default async function ProfessorDashboardPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: classStatsQueryKey,
    queryFn: getProfessorClassStats,
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Desempenho das Turmas</h1>
          <p className="page-subtitle">Desempenho das turmas e alunos em risco.</p>
        </div>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <DashboardContent />
      </HydrationBoundary>
    </>
  );
}
