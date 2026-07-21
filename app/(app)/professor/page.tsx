import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, ChevronRight, FilePlus2, Users } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { ActivationChecklist } from "@/components/professor/ActivationChecklist";
import { DashboardProgressCard } from "@/components/ui/dashboard-progress-card";
import { getProfessorOnboardingProgress } from "@/lib/dashboard/onboardingProgress";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Início" };

const QUICK_ACTIONS = [
  { href: "/professor/provas/nova", title: "Gerar prova", desc: "Crie uma avaliação com IA em poucos minutos.", icon: FilePlus2 },
  { href: "/professor/turmas", title: "Criar turma", desc: "Organize alunos e compartilhe atividades.", icon: Users },
  { href: "/professor/biblioteca", title: "Ver biblioteca", desc: "Acesse provas, atividades e materiais salvos.", icon: BookOpen },
];

export default async function ProfessorHomePage() {
  const { fullName } = await getSession();
  const firstName = (fullName || "Professor").split(" ")[0];
  let onboardingProgress;
  try {
    onboardingProgress = await getProfessorOnboardingProgress();
  } catch {
    onboardingProgress = null;
  }

  return (
    <>
      <div className="mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Olá, {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">O que você quer fazer hoje?</p>
        </div>
      </div>

      {onboardingProgress && onboardingProgress.completedSteps < onboardingProgress.totalSteps && <DashboardProgressCard title="Comece pela sua primeira turma" description="Complete estas etapas para começar a acompanhar seus alunos." steps={[{ id: "class", label: "Criar uma turma", description: "Organize seus alunos em uma turma.", completed: onboardingProgress.hasClass, href: "/professor/turmas", actionLabel: "Criar turma" }, { id: "exam", label: "Salvar uma prova", description: "Prepare uma avaliação para sua turma.", completed: onboardingProgress.hasSavedExam, href: "/professor/provas/nova", actionLabel: "Criar prova" }, { id: "student", label: "Convidar um aluno", description: "Tenha pelo menos um aluno matriculado em uma turma.", completed: onboardingProgress.hasInvitedStudent, href: "/professor/turmas", actionLabel: "Convidar aluno" }]} />}

      <ActivationChecklist />

      <section className="mt-6" aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title" className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Ações rápidas</h2>
        <div className="grid gap-2.5 lg:grid-cols-3">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.href} href={a.href} className="group flex min-h-20 items-center gap-3 rounded-md border border-border bg-card px-3.5 py-3 outline-none transition-colors hover:border-border-hover hover:bg-card-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:bg-card-2">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-brand-dim text-brand-text" aria-hidden><Icon size={19} strokeWidth={1.8} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base font-bold text-foreground">{a.title}</span>
                  <span className="mt-0.5 block text-xs leading-normal text-muted-foreground">{a.desc}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden />
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
