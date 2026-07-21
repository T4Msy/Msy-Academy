"use client";

import { EmptyState } from "@/components/EmptyState";
import { useClassStats } from "@/hooks/useClassStats";
import { DashboardProgressCard } from "@/components/ui/dashboard-progress-card";
import type { ProfessorOnboardingProgress } from "@/lib/dashboard/onboardingProgress";

/**
 * Metade client do piloto de hidratação: o primeiro render lê o cache
 * desidratado pelo prefetch do page.tsx (nada de spinner na primeira
 * pintura); depois o TanStack Query governa refetch/invalidação.
 * Markup idêntico ao page server-only anterior (classes do shell legado —
 * a conversão visual desta página acontece na Fase 2).
 */
export function DashboardContent({ onboardingProgress }: { onboardingProgress: ProfessorOnboardingProgress | null }) {
  const { data: classStats, isError } = useClassStats();

  if (isError) {
    return <p className="mt-1 text-xs leading-snug text-muted-foreground">Não foi possível carregar o desempenho das turmas.</p>;
  }
  if (!classStats) return null;

  if (classStats.length === 0) {
    return (
      <div className="flex flex-col gap-3.5">
        {onboardingProgress && <DashboardProgressCard title="Comece pela sua primeira turma" description="Complete estas etapas para começar a acompanhar seus alunos." steps={[{ id: "class", label: "Criar uma turma", description: "Organize seus alunos em uma turma.", completed: onboardingProgress.hasClass, href: "/professor/turmas", actionLabel: "Criar turma" }, { id: "exam", label: "Salvar uma prova", description: "Prepare uma avaliação para sua turma.", completed: onboardingProgress.hasSavedExam, href: "/professor/provas/nova", actionLabel: "Criar prova" }, { id: "student", label: "Convidar um aluno", description: "Tenha pelo menos um aluno matriculado em uma turma.", completed: onboardingProgress.hasInvitedStudent, href: "/professor/turmas", actionLabel: "Convidar aluno" }]} />}
        <EmptyState variant="turma" title="Sem turmas ainda" text="Crie uma turma para ver o desempenho dos alunos aqui." />
      </div>
    );
  }

  const studentsAtRisk = classStats.flatMap((classStat) => classStat.students.filter((student) => student.atRisk));
  const overdueAssignments = studentsAtRisk.reduce((total, student) => total + student.overdueCount, 0);

  return (
    <div className="flex flex-col gap-3.5">
      {onboardingProgress && <DashboardProgressCard title="Comece pela sua primeira turma" description="Complete estas etapas para começar a acompanhar seus alunos." steps={[{ id: "class", label: "Criar uma turma", description: "Organize seus alunos em uma turma.", completed: onboardingProgress.hasClass, href: "/professor/turmas", actionLabel: "Criar turma" }, { id: "exam", label: "Salvar uma prova", description: "Prepare uma avaliação para sua turma.", completed: onboardingProgress.hasSavedExam, href: "/professor/provas/nova", actionLabel: "Criar prova" }, { id: "student", label: "Convidar um aluno", description: "Tenha pelo menos um aluno matriculado em uma turma.", completed: onboardingProgress.hasInvitedStudent, href: "/professor/turmas", actionLabel: "Convidar aluno" }]} />}
      <section className="overflow-hidden rounded-lg border border-danger-border bg-card shadow-elevated transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5.5">
          <div>
            <h2 className="font-display text-lg font-bold tracking-[-0.2px] text-foreground">Alunos em risco</h2>
            <p className="mt-1 text-xs leading-snug text-muted-foreground">Identificados por acerto médio abaixo de 50% em objetivas ou tarefas vencidas sem envio.</p>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span><b className="font-display text-2xl text-danger-text">{studentsAtRisk.length}</b> alunos</span>
            <span><b className="font-display text-2xl text-foreground">{overdueAssignments}</b> atrasos</span>
          </div>
        </div>
      </section>
      {classStats.map(({ klass, students }) => (
        <section key={klass.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">{klass.name}</h2>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{students.length} alunos</span>
              {students.some((s) => s.atRisk) && (
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-danger-border bg-danger-dim px-2.5 py-1 text-xs text-danger-text">{students.filter((s) => s.atRisk).length} em risco</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4.5 p-5.5">
            {students.length === 0 ? (
              <p className="mt-0 text-xs leading-snug text-muted-foreground">Nenhum aluno matriculado.</p>
            ) : (
              <ul className="flex list-none flex-col gap-2">
                {students.map((s) => (
                  <li key={s.studentId} className={`grid gap-2 rounded-sm border px-3 py-[9px] text-[13.5px] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${s.atRisk ? "border-danger-border bg-danger-dim text-muted-foreground" : "border-brand-border bg-brand-dim text-foreground"}`}>
                    <div className="flex min-w-0 justify-between gap-2">
                      <span>
                        <b>{s.name}</b>
                        {s.overdueCount > 0 &&
                          ` · ${s.overdueCount} tarefa${s.overdueCount > 1 ? "s" : ""} atrasada${s.overdueCount > 1 ? "s" : ""}`}
                        {s.atRisk && (
                          <>
                            {" "}
                            <span aria-hidden="true">⚠</span>
                            <span className="visually-hidden"> (em risco)</span>
                          </>
                        )}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {s.accuracyPct !== null ? `${s.accuracyPct}%` : "sem dados"}
                      </span>
                    </div>
                    {s.accuracyPct !== null && (
                      <div className="h-2 overflow-hidden rounded-full bg-[rgba(var(--overlay-rgb),0.06)] sm:col-span-2">
                        <div
                          className={`h-full rounded-full transition-[width] duration-[320ms] ${s.atRisk ? "bg-danger" : "bg-brand"}`}
                          style={{ width: `${Math.max(4, s.accuracyPct)}%` }}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
