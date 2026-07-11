import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CorrecaoReview, type DiscursivaItem } from "./CorrecaoReview";

export const dynamic = "force-dynamic";

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
  const objective = list.filter((a: any) => a.questions?.type !== "DISCURSIVA");
  const discursivas: DiscursivaItem[] = list
    .filter((a: any) => a.questions?.type === "DISCURSIVA")
    .map((a: any) => ({
      questionId: a.question_id,
      statement: a.questions.statement,
      referenceAnswer: Array.isArray(a.questions.correct_answer) ? a.questions.correct_answer.join(", ") : a.questions.correct_answer,
      studentAnswer: a.answer,
    }));

  const objectiveScoreSum = objective.reduce((sum: number, a: any) => sum + (a.score ?? 0), 0);

  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/professor/correcao" className="sidebar-link" style={{ padding: "0 0 8px", display: "inline-block" }}>
            ← Correção
          </Link>
          <h1 className="page-title">{studentProfile?.full_name || "Aluno"}</h1>
          <div className="exam-meta">
            <span className="chip">{objective.length} objetivas (auto-corrigidas)</span>
            <span className="chip">{discursivas.length} discursivas</span>
          </div>
        </div>
      </div>

      {submission.status === "GRADED" ? (
        <div className="notice">Este envio já foi corrigido.</div>
      ) : discursivas.length === 0 ? (
        <div className="notice">Sem questões discursivas para corrigir neste envio.</div>
      ) : (
        <CorrecaoReview submissionId={submissionId} objectiveScoreSum={objectiveScoreSum} discursivas={discursivas} />
      )}
    </>
  );
}
