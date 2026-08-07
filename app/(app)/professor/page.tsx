import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { ActivationChecklist } from "@/components/professor/ActivationChecklist";
import { getProfessorOnboardingProgress } from "@/lib/dashboard/onboardingProgress";
import { ExploreResourcesCard } from "@/components/professor/ExploreResourcesCard";
import { getProfessorExploreResources } from "@/lib/dashboard/exploreResources";
import { getProfessorWorkDashboard } from "@/lib/dashboard/professorWork";
import { TeacherWorkDashboard } from "@/components/professor/TeacherWorkDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Início" };

export default async function ProfessorHomePage() {
  const { fullName, user } = await getSession();
  const firstName = (fullName || "Professor").split(" ")[0];
  let onboardingProgress;
  let exploreResources;
  try {
    onboardingProgress = await getProfessorOnboardingProgress();
  } catch {
    onboardingProgress = null;
  }
  if (onboardingProgress && onboardingProgress.completedSteps === onboardingProgress.totalSteps) {
    try {
      exploreResources = await getProfessorExploreResources();
    } catch {
      exploreResources = null;
    }
  }
  const work = user ? await getProfessorWorkDashboard(user.id) : null;

  return (
    <>
      <div className="mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Olá, {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Organize seu trabalho e acompanhe suas turmas.</p>
        </div>
      </div>

      {work && <TeacherWorkDashboard data={work} />}
      <div className="mt-8 space-y-5"><ActivationChecklist />{exploreResources?.resources.length && exploreResources.userId && <ExploreResourcesCard resources={exploreResources.resources} userId={exploreResources.userId} />}</div>
    </>
  );
}
