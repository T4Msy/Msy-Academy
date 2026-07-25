import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CorrecaoReview, type DiscursivaItem } from "./CorrecaoReview";
import { GabaritoCorrection } from "./GabaritoCorrection";

export const dynamic = "force-dynamic";

type AnswerRow = { question_id: string; answer: unknown; is_correct: boolean | null; score: number | null; questions: { type: string; statement: string; correct_answer: string | string[] | null } | null };

function answerText(answer: unknown): string {
  if (typeof answer === "string") return answer;
  if (Array.isArray(answer)) return answer.join(", ");
  return "Sem resposta";
}

export default async function CorrecaoDetailPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  const supabase = await createClient();
  const { data: submission } = await supabase.from("submissions").select("id, status, student_id, submitted_at").eq("id", submissionId).single();
  if (!submission) notFound();
  const [{ data: answers }, { data: grade }, { data: studentProfile }] = await Promise.all([
    supabase.from("submission_answers").select("question_id, answer, is_correct, score, questions(type, statement, correct_answer)").eq("submission_id", submissionId),
    supabase.from("grades").select("total_score, feedback").eq("submission_id", submissionId).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", submission.student_id).single(),
  ]);
  const rows = (answers ?? []) as unknown as AnswerRow[];
  const objective = rows.filter((answer) => answer.questions?.type !== "DISCURSIVA");
  const discursivas: DiscursivaItem[] = rows.filter((answer) => answer.questions?.type === "DISCURSIVA").map((answer) => ({ questionId: answer.question_id, statement: answer.questions!.statement, referenceAnswer: Array.isArray(answer.questions!.correct_answer) ? answer.questions!.correct_answer.join(", ") : (answer.questions!.correct_answer ?? ""), studentAnswer: answerText(answer.answer) }));
  const objectiveScoreSum = objective.reduce((sum, answer) => sum + (answer.score ?? 0), 0);
  const objectiveNeedsKey = objective.some((answer) => answer.is_correct === null);
  const completed = submission.status === "GRADED";

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><Link href={completed ? "/professor/correcao?view=history" : "/professor/correcao"} className="inline-flex items-center gap-2 pb-2 text-sm text-muted-foreground transition-colors hover:text-foreground">← Correção</Link><h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">{studentProfile?.full_name || "Aluno"}</h1><div className="mt-0.5 flex flex-wrap gap-1.5"><span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{objective.length} objetivas</span><span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{discursivas.length} discursivas</span></div></div></div>
    {completed && <div className="mb-4 rounded-md border border-brand-border bg-brand-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-brand-text">Entrega corrigida{grade ? ` · Nota: ${grade.total_score}` : ""}{grade?.feedback ? ` · ${grade.feedback}` : ""}</div>}
    {rows.length > 0 && <div className="mb-5 flex flex-col gap-3.5">{rows.map((answer, index) => { const question = answer.questions; if (!question || (!completed && question.type === "DISCURSIVA")) return null; const reference = Array.isArray(question.correct_answer) ? question.correct_answer.join(", ") : question.correct_answer ?? ""; return <section key={answer.question_id} className="rounded-lg border border-border bg-card p-5 shadow-elevated"><div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Questão {index + 1} · {question.type}</div><p className="mt-3 text-foreground">{question.statement}</p><p className="mt-3 text-sm text-muted-foreground"><b>Resposta do aluno:</b> {answerText(answer.answer)}</p><p className="mt-1 text-sm text-muted-foreground"><b>Resposta de referência:</b> {reference}</p>{answer.is_correct !== null && <p className="mt-1 text-sm text-muted-foreground"><b>Resultado:</b> {answer.is_correct ? "Correta" : "Incorreta"}{answer.score !== null ? ` · ${answer.score} ponto(s)` : ""}</p>}</section>; })}</div>}
    {!completed && objectiveNeedsKey && <GabaritoCorrection submissionId={submissionId} questionCount={objective.length} />}
    {!completed && !objectiveNeedsKey && <CorrecaoReview submissionId={submissionId} objectiveScoreSum={objectiveScoreSum} discursivas={discursivas} />}
  </>;
}
