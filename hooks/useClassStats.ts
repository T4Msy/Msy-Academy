"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClassStat } from "@/lib/dashboard/deriveClassStats";
import { classStatsQueryKey } from "@/lib/dashboard/queryKeys";

/**
 * Fonte de dados do dashboard no client. O primeiro render vem hidratado do
 * prefetch do Server Component (sem flash de loading); refetches/invalidação
 * passam pelo route handler.
 */
export function useClassStats() {
  return useQuery<ClassStat[]>({
    queryKey: classStatsQueryKey,
    queryFn: async () => {
      const res = await fetch("/api/professor/dashboard");
      if (!res.ok) throw new Error("Não foi possível carregar o desempenho das turmas.");
      return res.json();
    },
  });
}
