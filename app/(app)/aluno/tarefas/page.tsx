import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { isAssessmentExpired } from "@/lib/assessments/deadline";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tarefas" };

function formatDate(iso: string | null): string {
  if (!iso) return "Sem prazo";
  try {
    return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default async function TarefasPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const completedView = view === "completed";
  const expiredView = view === "expired";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, content_type, content_id, due_at, class_id")
    .order("due_at", { ascending: true, nullsFirst: false });
  const list = assignments ?? [];
  const examIds = list.filter((assignment) => assignment.content_type === "EXAM").map((assignment) => assignment.content_id);
  const activityIds = list.filter((assignment) => assignment.content_type === "ACTIVITY").map((assignment) => assignment.content_id);
  const [{ data: exams }, { data: activities }, { data: submissions }] = await Promise.all([
    examIds.length ? supabase.from("exams").select("id, title").in("id", examIds) : Promise.resolve({ data: [] }),
    activityIds.length ? supabase.from("activities").select("id, title").in("id", activityIds) : Promise.resolve({ data: [] }),
    supabase.from("submissions").select("id, assignment_id, status, submitted_at").eq("student_id", user!.id).not("assignment_id", "is", null),
  ]);

  const submissionList = submissions ?? [];
  const submissionIds = submissionList.map((submission) => submission.id);
  const { data: grades } = submissionIds.length
    ? await supabase.from("grades").select("submission_id, total_score").in("submission_id", submissionIds)
    : { data: [] as { submission_id: string; total_score: number }[] };
  const examTitleById = new Map((exams ?? []).map((exam: { id: string; title: string }) => [exam.id, exam.title]));
  const activityTitleById = new Map((activities ?? []).map((activity: { id: string; title: string }) => [activity.id, activity.title]));
  const submissionByAssignment = new Map(submissionList.filter((submission) => submission.assignment_id).map((submission) => [submission.assignment_id!, submission]));
  const gradeBySubmission = new Map((grades ?? []).map((grade) => [grade.submission_id, grade.total_score]));
  const visibleAssignments = list.filter((assignment) => {
    const status = submissionByAssignment.get(assignment.id)?.status;
    const expired = isAssessmentExpired(assignment.due_at);
    if (completedView) return status === "SUBMITTED" || status === "GRADED";
    if (expiredView) return expired && (!status || status === "PENDING");
    return !expired && (!status || status === "PENDING");
  });

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">{completedView ? "Tarefas Concluídas" : expiredView ? "Tarefas Encerradas" : "Tarefas"}</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">{visibleAssignments.length > 0 ? `${visibleAssignments.length} tarefa${visibleAssignments.length > 1 ? "s" : ""}` : completedView ? "As tarefas enviadas aparecem neste histórico." : expiredView ? "Os prazos destas avaliações foram encerrados." : "As tarefas atribuídas pela sua turma aparecem aqui."}</p>
        </div>
      </div>

      <nav aria-label="Filtro de tarefas" className="mb-5 flex gap-2 border-b border-border">
        <Link href="/aluno/tarefas" className={`border-b-2 px-3 py-2 text-sm font-semibold ${!completedView && !expiredView ? "border-brand text-brand-text" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Pendentes</Link>
        <Link href="/aluno/tarefas?view=expired" className={`border-b-2 px-3 py-2 text-sm font-semibold ${expiredView ? "border-brand text-brand-text" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Encerradas</Link>
        <Link href="/aluno/tarefas?view=completed" className={`border-b-2 px-3 py-2 text-sm font-semibold ${completedView ? "border-brand text-brand-text" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Tarefas Concluídas</Link>
      </nav>

      {visibleAssignments.length === 0 ? (
        <EmptyState variant="tarefa" title={completedView ? "Nenhuma tarefa concluída" : expiredView ? "Nenhuma tarefa encerrada" : "Nenhuma tarefa pendente"} text={completedView ? "Envie uma atividade para consultá-la aqui depois." : expiredView ? "As avaliações vencidas aparecerão aqui." : "Entre em uma turma para ver as tarefas atribuídas pelo seu professor."} />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {visibleAssignments.map((assignment) => {
            const title = assignment.content_type === "EXAM" ? examTitleById.get(assignment.content_id) : activityTitleById.get(assignment.content_id);
            const submission = submissionByAssignment.get(assignment.id);
            const status = submission?.status;
            const grade = submission ? gradeBySubmission.get(submission.id) : undefined;
            const expired = isAssessmentExpired(assignment.due_at);
            return (
              <Link key={assignment.id} href={`/aluno/tarefas/${assignment.id}`} className="flex flex-col gap-2.5 rounded-md border border-border bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:border-border-hover hover:bg-card-2">
                <div className="font-display text-base font-bold tracking-[-0.2px] text-foreground">{title ?? "Tarefa"}</div>
                <div className="mt-0.5 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{assignment.content_type === "EXAM" ? "Prova" : "Atividade"}</span>
                  {expired && <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-danger-border bg-danger-dim px-2.5 py-1 text-xs font-semibold text-danger-text">Prazo expirado</span>}
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{status === "GRADED" ? "Corrigida" : status ? "Enviada" : "Pendente"}</span>
                  {grade !== undefined && <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">Nota: {grade}</span>}
                </div>
                <div className="mt-auto flex items-center justify-between gap-2.5 pt-2 text-xs text-subtle"><span>{completedView ? "Concluída em" : "Prazo"}</span><span>{completedView ? formatDate(submission?.submitted_at ?? null) : formatDate(assignment.due_at)}</span></div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
