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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: simulado } = await supabase.from("simulados").select("id, title").eq("id", id).single();
  if (!simulado) notFound();

  const { data: items } = await supabase
    .from("simulado_questions")
    .select("position, questions(id, type, statement, options, correct_answer, explanation, tags)")
    .eq("simulado_id", id)
    .order("position");

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
    const { data: submissionAnswers } = await supabase
      .from("submission_answers")
      .select("question_id, answer, is_correct, score")
      .eq("submission_id", submission!.id);
    answersById = new Map((submissionAnswers ?? []).map((a) => [a.question_id, { answer: a.answer, is_correct: a.is_correct, score: a.score }]));

    const { data: gradeRow } = await supabase.from("grades").select("total_score, feedback").eq("submission_id", submission!.id).maybeSingle();
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
      <div className="page-head">
        <div>
          <Link href="/aluno/simulados" className="sidebar-link" style={{ padding: "0 0 8px", display: "inline-block" }}>
            ← Simulados
          </Link>
          <h1 className="page-title">{simulado.title}</h1>
          <div className="exam-meta">
            <span className="chip">{questions.length} questões</span>
          </div>
        </div>
      </div>

      {!isDone && <ResolveForm parent={{ simuladoId: id }} questions={questions as ResolveQuestion[]} />}

      {isDone && (
        <>
          {breakdown.length > 0 && (
            <section className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div className="card-title-group">
                  <h2 className="card-title">Desempenho por tema</h2>
                </div>
              </div>
              <div className="card-body">
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
