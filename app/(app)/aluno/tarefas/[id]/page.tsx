import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResolveForm, type ResolveQuestion } from "../../_shared/ResolveForm";
import { ResultsView, type ResultQuestion, type AnswerRecord } from "../../_shared/ResultsView";

export const dynamic = "force-dynamic";

export default async function TarefaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: assignment } = await supabase.from("assignments").select("id, content_type, content_id, due_at").eq("id", id).single();
  if (!assignment) notFound();

  const title = assignment.content_type === "EXAM"
    ? (await supabase.from("exams").select("title").eq("id", assignment.content_id).single()).data?.title
    : (await supabase.from("activities").select("title").eq("id", assignment.content_id).single()).data?.title;

  const items = assignment.content_type === "EXAM"
    ? await supabase.from("exam_questions").select("position, questions(id, type, statement, options, correct_answer, explanation)").eq("exam_id", assignment.content_id).order("position")
    : await supabase.from("activity_items").select("position, questions(id, type, statement, options, correct_answer, explanation)").eq("activity_id", assignment.content_id).order("position");

  const questions: ResultQuestion[] = (items.data ?? [])
    .filter((it) => it.questions)
    .map((it) => it.questions as unknown as ResultQuestion);

  const { data: submission } = await supabase
    .from("submissions")
    .select("id, status, submitted_at")
    .eq("assignment_id", id)
    .eq("student_id", user!.id)
    .maybeSingle();

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
      <div className="page-head">
        <div>
          <Link href="/aluno/tarefas" className="sidebar-link" style={{ padding: "0 0 8px", display: "inline-block" }}>
            ← Tarefas
          </Link>
          <h1 className="page-title">{title ?? "Tarefa"}</h1>
          <div className="exam-meta">
            <span className="chip">{assignment.content_type === "EXAM" ? "Prova" : "Atividade"}</span>
            <span className="chip">{questions.length} questões</span>
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
