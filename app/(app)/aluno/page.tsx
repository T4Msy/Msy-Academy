import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getSession } from "@/lib/auth/session";
import { getQueryClient } from "@/lib/query/client";
import { getStudentDashboardStats } from "@/lib/dashboard/studentStats";
import { studentDashboardStatsQueryKey } from "@/lib/dashboard/queryKeys";
import { StudentPriorityDashboard } from "./StudentPriorityDashboard";
import { StudentMissionsCard } from "@/components/student/StudentMissionsCard";
import { getDerivedStudentMissionIds } from "@/lib/dashboard/studentMissions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Início" };

export default async function AlunoHomePage() {
  const { fullName } = await getSession();
  const firstName = (fullName || "aluno").split(" ")[0];
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: studentDashboardStatsQueryKey,
    queryFn: getStudentDashboardStats,
  });
  const stats = queryClient.getQueryData<Awaited<ReturnType<typeof getStudentDashboardStats>>>(
    studentDashboardStatsQueryKey,
  );
  const initialCompletedIds = stats
    ? getDerivedStudentMissionIds({
        hasClasses: stats.routine.classes.length > 0,
        hasTasks: stats.routine.assignmentProgress.total > 0,
        hasMaterials: stats.routine.classes.some((classroom) => classroom.materialsCount > 0),
        hasFlashcards: stats.flashcardDecks > 0,
      })
    : [];

  return (
    <>
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Olá, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Veja suas prioridades e continue seu estudo.
        </p>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <StudentPriorityDashboard />
      </HydrationBoundary>
      <section className="mt-6" aria-labelledby="student-missions-title">
        <div className="mb-3">
          <h2
            id="student-missions-title"
            className="font-display text-xl font-bold text-foreground"
          >
            Missões
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete desafios para conhecer e aproveitar melhor a plataforma.
          </p>
        </div>
        <StudentMissionsCard initialCompletedIds={initialCompletedIds} />
      </section>
    </>
  );
}
