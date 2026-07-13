import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResolveForm, type ResolveQuestion } from "../../_shared/ResolveForm";
import { ResultsView, type ResultQuestion, type AnswerRecord } from "../../_shared/ResultsView";
import { CategoricalBar } from "@/components/charts/CategoricalBar";

export const dynamic = "force-dynamic";

export default async function SimuladoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    { data: simulado },
    { data: items },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("simulados").select("id, title").eq("id", id).single(),
    supabase
      .from("simulado_questions")
      .select("position, questions(id, type, statement, options, correct_answer, explanation, tags)")
      .eq("simulado_id", id)
      .order("position"),
  ]);
  if (!simulado) notFound();

  const questions: (ResultQuestion & { tags: string[] })[] = (items ?? [])
    .filter((it) => it.questions)
    .map((it) => it.questions as unknown as ResultQuestion & { tags: string[] });

  const { data: submission } = await supabase
    .from("submissions")
    .select("id, status")
    .eq("simulado_id", id)
    .eq("student_id", user!.id)
    .maybeSingle();

  const isDone = submission && submission.status !== "PENDING";

  let answersById = new Map<string, AnswerRecord>();
  let grade: { total_score: number; feedback: string | null } | null = null;
  let breakdown: { tag: string; correct: number; total: number }[] = [];

  if (isDone) {
    const [{ data: submissionAnswers }, { data: gradeRow }] = await Promise.all([
      supabase.from("submission_answers").select("question_id, answer, is_correct, score").eq("submission_id", submission!.id),
      supabase.from("grades").select("total_score, feedback").eq("submission_id", submission!.id).maybeSingle(),
    ]);
    answersById = new Map((submissionAnswers ?? []).map((a) => [a.question_id, { answer: a.answer, is_correct: a.is_correct, score: a.score }]));
    grade = gradeRow;

    // Breakdown por tema (tag) — RF-A05.
    const byTag = new Map<string, { correct: number; total: number }>();
    for (const q of questions) {
      const a = answersById.get(q.id);
      for (const tag of q.tags?.length ? q.tags : ["Geral"]) {
        const entry = byTag.get(tag) ?? { correct: 0, total: 0 };
        entry.total += 1;
        if (a?.is_correct) entry.correct += 1;
        byTag.set(tag, entry);
      }
    }
    breakdown = Array.from(byTag.entries()).map(([tag, v]) => ({ tag, ...v }));
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/aluno/simulados" className="inline-flex items-center gap-2 pb-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            ← Simulados
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">{simulado.title}</h1>
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{questions.length} questões</span>
          </div>
        </div>
      </div>

      {!isDone && <ResolveForm parent={{ simuladoId: id }} questions={questions as ResolveQuestion[]} />}

      {isDone && (
        <>
          {breakdown.length > 0 && (
            <section className="mb-4 overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Desempenho por tema</h2>
                </div>
              </div>
              <div className="flex flex-col gap-4.5 p-5.5">
                <CategoricalBar
                  items={breakdown.map((b, i) => ({
                    label: b.tag,
                    value: b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0,
                    catSlot: (i % 8) + 1,
                    suffix: `% (${b.correct}/${b.total})`,
                  }))}
                />
              </div>
            </section>
          )}
          <ResultsView status={submission!.status as "SUBMITTED" | "GRADED"} grade={grade} questions={questions} answersById={answersById} />
        </>
      )}
    </>
  );
}
