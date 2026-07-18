"use client";

import { useQuery } from "@tanstack/react-query";
import type { StudentDashboardStats } from "@/lib/dashboard/studentStats";
import { studentDashboardStatsQueryKey } from "@/lib/dashboard/queryKeys";

export function useStudentDashboardStats() {
  return useQuery<StudentDashboardStats>({
    queryKey: studentDashboardStatsQueryKey,
    queryFn: async () => {
      const response = await fetch("/api/aluno/dashboard");
      if (!response.ok) throw new Error("Não foi possível carregar seu progresso.");
      return response.json();
    },
  });
}
