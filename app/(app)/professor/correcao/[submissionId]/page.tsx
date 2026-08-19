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

export default async function CorrecaoDetailPage({ params, searchParams }: { params: Promise<{ submissionId: string }>; searchParams: Promise<{ turma?: string }> }) {
  const { submissionId } = await params;
  const { turma } = await searchParams;
  const supabase = await createClient();
  const { data: submission } = await supabase.from("submissions").select("id, status, student_id, submitted_at, assignment_id").eq("id", submissionId).single();
  if (!submission) notFound();
  const [{ data: answers }, { data: grade }, { data: studentProfile }, { data: assignment }] = await Promise.all([
    supabase.from("submission_answers").select("question_id, answer, is_correct, score, questions(type, statement, correct_answer)").eq("submission_id", submissionId),
    supabase.from("grades").select("total_score, feedback").eq("submission_id", submissionId).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", submission.student_id).single(),
    submission.assignment_id ? supabase.from("assignments").select("class_id, content_id, content_type, due_at, classes(name)").eq("id", submission.assignment_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const rows = (answers ?? []) as unknown as AnswerRow[];
  const objective = rows.filter((answer) => answer.questions?.type !== "DISCURSIVA");
  const discursivas: DiscursivaItem[] = rows.filter((answer) => answer.questions?.type === "DISCURSIVA").map((answer) => ({ questionId: answer.question_id, statement: answer.questions!.statement, referenceAnswer: Array.isArray(answer.questions!.correct_answer) ? answer.questions!.correct_answer.join(", ") : (answer.questions!.correct_answer ?? ""), studentAnswer: answerText(answer.answer) }));
  const objectiveScoreSum = objective.reduce((sum, answer) => sum + (answer.score ?? 0), 0);
  const objectiveNeedsKey = objective.some((answer) => answer.is_correct === null);
  const completed = submission.status === "GRADED";
  const { data: queueRows } = !completed && submission.assignment_id
    ? await supabase.from("submissions").select("id").eq("assignment_id", submission.assignment_id).eq("status", "SUBMITTED").order("submitted_at", { ascending: true })
    : { data: [] as { id: string }[] };
  const queuePosition = queueRows?.findIndex((row) => row.id === submissionId) ?? -1;
  const nextRow = queuePosition >= 0 ? queueRows?.[queuePosition + 1] : undefined;
  const nextHref = nextRow ? `/professor/correcao/${nextRow.id}${turma ? `?turma=${turma}` : ""}` : null;
  const assignmentData = assignment as unknown as { class_id: string; content_id: string; content_type: "EXAM" | "ACTIVITY"; due_at: string | null; classes: { name: string } | { name: string }[] | null } | null;
  const contentTitle = assignmentData?.content_type === "EXAM"
    ? (await supabase.from("exams").select("title").eq("id", assignmentData.content_id).maybeSingle()).data?.title ?? "Prova"
    : assignmentData?.content_type === "ACTIVITY"
      ? (await supabase.from("activities").select("title").eq("id", assignmentData.content_id).maybeSingle()).data?.title ?? "Atividade"
      : "Conteúdo";
  const className = Array.isArray(assignmentData?.classes) ? assignmentData.classes[0]?.name : assignmentData?.classes?.name;

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><Link href={turma ? `/professor/correcao/turma/${turma}${completed ? "?view=history" : ""}` : completed ? "/professor/correcao?view=history" : "/professor/correcao"} className="inline-flex items-center gap-2 pb-2 text-sm text-muted-foreground transition-colors hover:text-foreground">← Correção</Link>{!completed && queuePosition >= 0 && <p className="mb-2 text-sm font-semibold text-brand-text">Aluno {queuePosition + 1} de {queueRows?.length ?? 0}</p>}<h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">{studentProfile?.full_name || "Aluno"}</h1><p className="mt-1 text-sm text-muted-foreground">{contentTitle}{className ? ` · ${className}` : ""}</p><div className="mt-2 flex flex-wrap gap-1.5"><span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{objective.length} objetivas</span><span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{discursivas.length} discursivas</span>{assignmentData?.due_at && <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">Prazo {new Date(assignmentData.due_at).toLocaleDateString("pt-BR")}</span>}</div></div></div>
    {completed && <div className="mb-4 rounded-md border border-brand-border bg-brand-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-brand-text">Entrega corrigida{grade ? ` · Nota: ${grade.total_score}` : ""}{grade?.feedback ? ` · ${grade.feedback}` : ""}</div>}
    {rows.length > 0 && <div className="mb-5 flex flex-col gap-3.5">{rows.map((answer, index) => { const question = answer.questions; if (!question || (!completed && question.type === "DISCURSIVA")) return null; const reference = Array.isArray(question.correct_answer) ? question.correct_answer.join(", ") : question.correct_answer ?? ""; return <section key={answer.question_id} className="rounded-lg border border-border bg-card p-5 shadow-elevated"><div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Questão {index + 1} · {question.type}</div><p className="mt-3 text-foreground">{question.statement}</p><p className="mt-3 text-sm text-muted-foreground"><b>Resposta do aluno:</b> {answerText(answer.answer)}</p><p className="mt-1 text-sm text-muted-foreground"><b>Resposta de referência:</b> {reference}</p>{answer.is_correct !== null && <p className="mt-1 text-sm text-muted-foreground"><b>Resultado:</b> {answer.is_correct ? "Correta" : "Incorreta"}{answer.score !== null ? ` · ${answer.score} ponto(s)` : ""}</p>}</section>; })}</div>}
    {!completed && objectiveNeedsKey && <GabaritoCorrection submissionId={submissionId} questionCount={objective.length} />}
    {!completed && !objectiveNeedsKey && <CorrecaoReview submissionId={submissionId} objectiveScoreSum={objectiveScoreSum} discursivas={discursivas} returnHref={turma ? `/professor/correcao/turma/${turma}?view=history` : "/professor/correcao"} nextHref={nextHref} />}
  </>;
}
