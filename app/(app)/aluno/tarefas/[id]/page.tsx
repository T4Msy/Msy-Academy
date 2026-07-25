import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResolveForm, type ResolveQuestion } from "../../_shared/ResolveForm";
import { ResultsView, type ResultQuestion, type AnswerRecord } from "../../_shared/ResultsView";
import { isAssessmentExpired } from "@/lib/assessments/deadline";

export const dynamic = "force-dynamic";

export default async function TarefaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: assignment } = await supabase.from("assignments").select("id, content_type, content_id, due_at").eq("id", id).single();
  if (!assignment) notFound();

  const { data: submission } = await supabase
    .from("submissions")
    .select("id, status, submitted_at")
    .eq("assignment_id", id)
    .eq("student_id", user!.id)
    .maybeSingle();

  const title = assignment.content_type === "EXAM"
    ? (await supabase.from("exams").select("title").eq("id", assignment.content_id).single()).data?.title
    : (await supabase.from("activities").select("title").eq("id", assignment.content_id).single()).data?.title;

  const expired = isAssessmentExpired(assignment.due_at);
  if (expired && (!submission || submission.status === "PENDING")) {
    return (
      <section className="overflow-hidden rounded-lg border border-danger-border bg-card shadow-elevated" role="alert" aria-labelledby="expired-assessment-title">
        <div className="p-5.5 sm:p-7">
          <span className="inline-flex rounded-full border border-danger-border bg-danger-dim px-2.5 py-1 text-xs font-semibold text-danger-text">Prazo expirado</span>
          <h1 id="expired-assessment-title" className="mt-4 font-display text-2xl font-extrabold text-foreground">{title ?? "Avaliação"}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">A data limite desta avaliação foi encerrada. Ela não aceita mais respostas.</p>
          <Link href="/aluno/tarefas?view=expired" className="mt-5 inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground outline-none transition-colors hover:border-border-hover hover:bg-card-2 focus-visible:ring-[3px] focus-visible:ring-brand-glow">Ver avaliações encerradas</Link>
        </div>
      </section>
    );
  }

  const items = assignment.content_type === "EXAM"
    ? await supabase.from("exam_questions").select("position, questions(id, type, statement, options, correct_answer, explanation)").eq("exam_id", assignment.content_id).order("position")
    : await supabase.from("activity_items").select("position, questions(id, type, statement, options, correct_answer, explanation)").eq("activity_id", assignment.content_id).order("position");

  const questions: ResultQuestion[] = (items.data ?? [])
    .filter((it) => it.questions)
    .map((it) => it.questions as unknown as ResultQuestion);

  const isDone = submission && submission.status !== "PENDING";

  let answersById = new Map<string, AnswerRecord>();
  let grade: { total_score: number; feedback: string | null } | null = null;
  if (isDone) {
    const { data: submissionAnswers } = await supabase
      .from("submission_answers")
      .select("question_id, answer, is_correct, score")
      .eq("submission_id", submission!.id);
    answersById = new Map((submissionAnswers ?? []).map((a) => [a.question_id, { answer: a.answer, is_correct: a.is_correct, score: a.score }]));

    const { data: gradeRow } = await supabase.from("grades").select("total_score, feedback").eq("submission_id", submission!.id).maybeSingle();
    grade = gradeRow;
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/aluno/tarefas" className="inline-flex items-center gap-2 pb-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            ← Tarefas
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">{title ?? "Tarefa"}</h1>
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{assignment.content_type === "EXAM" ? "Prova" : "Atividade"}</span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{questions.length} questões</span>
          </div>
        </div>
      </div>

      {!isDone && <ResolveForm parent={{ assignmentId: id }} questions={questions as ResolveQuestion[]} />}
      {isDone && (
        <ResultsView status={submission!.status as "SUBMITTED" | "GRADED"} grade={grade} questions={questions} answersById={answersById} />
      )}
    </>
  );
}
