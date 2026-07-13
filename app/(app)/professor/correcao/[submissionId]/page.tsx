import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CorrecaoReview, type DiscursivaItem } from "./CorrecaoReview";

export const dynamic = "force-dynamic";

type AnswerRow = {
  question_id: string;
  answer: string | null;
  score: number | null;
  questions: {
    type: string;
    statement: string;
    correct_answer: string | string[] | null;
  } | null;
};

export default async function CorrecaoDetailPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  const supabase = await createClient();

  const { data: submission } = await supabase
    .from("submissions")
    .select("id, status, student_id")
    .eq("id", submissionId)
    .single();
  if (!submission) notFound();

  const { data: answers } = await supabase
    .from("submission_answers")
    .select("question_id, answer, is_correct, score, questions(type, statement, correct_answer)")
    .eq("submission_id", submissionId);

  const { data: studentProfile } = await supabase.from("profiles").select("full_name").eq("id", submission.student_id).single();

  const list = answers ?? [];
  // Mesmo caso: embed do PostgREST inferido como array; shape real é objeto.
  const rows = list as unknown as AnswerRow[];
  const objective = rows.filter((a) => a.questions?.type !== "DISCURSIVA");
  const discursivas: DiscursivaItem[] = rows
    .filter((a) => a.questions?.type === "DISCURSIVA")
    .map((a) => ({
      questionId: a.question_id,
      statement: a.questions!.statement,
      referenceAnswer: Array.isArray(a.questions!.correct_answer) ? a.questions!.correct_answer.join(", ") : (a.questions!.correct_answer ?? ""),
      studentAnswer: a.answer ?? "",
    }));

  const objectiveScoreSum = objective.reduce((sum, a) => sum + (a.score ?? 0), 0);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/professor/correcao" className="inline-flex items-center gap-2 pb-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            ← Correção
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">{studentProfile?.full_name || "Aluno"}</h1>
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{objective.length} objetivas (auto-corrigidas)</span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{discursivas.length} discursivas</span>
          </div>
        </div>
      </div>

      {submission.status === "GRADED" ? (
        <div className="mt-3.5 rounded-md border border-brand-border bg-brand-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-brand-text">Este envio já foi corrigido.</div>
      ) : discursivas.length === 0 ? (
        <div className="mt-3.5 rounded-md border border-brand-border bg-brand-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-brand-text">Sem questões discursivas para corrigir neste envio.</div>
      ) : (
        <CorrecaoReview submissionId={submissionId} objectiveScoreSum={objectiveScoreSum} discursivas={discursivas} />
      )}
    </>
  );
}
