import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ExamHeaderMenu } from "./ExamHeaderMenu";
import { QuestionsEditor, type QuestionsEditorActions } from "@/components/questions/QuestionsEditor";
import type { QuestionData } from "@/lib/questions/types";
import { addQuestionToExam, moveQuestion, regenerateQuestion, removeQuestionFromExam } from "../actions";
import { ExamExportActions } from "./ExamExportActions";
import { AiBadge } from "@/components/AiBadge";

export const dynamic = "force-dynamic";

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: exam }, { data: examQuestions }] = await Promise.all([
    supabase
      .from("exams")
      .select("id, title, course, style, include_answer_key, ai_provider, version, created_at")
      .eq("id", id)
      .single(),
    supabase
      .from("exam_questions")
      .select("position, questions(id, type, statement, options, correct_answer, explanation, difficulty, tags)")
      .eq("exam_id", id)
      .order("position"),
  ]);

  if (!exam) notFound();

  const questions: QuestionData[] = (examQuestions ?? [])
    .filter((eq) => eq.questions)
    .map((eq) => {
      const q = eq.questions as unknown as {
        id: string;
        type: QuestionData["type"];
        statement: string;
        options: QuestionData["options"];
        correct_answer: QuestionData["correct_answer"];
        explanation: string | null;
        difficulty: QuestionData["difficulty"];
        tags: string[];
      };
      return { ...q, position: eq.position };
    });

  const questionsActions: QuestionsEditorActions = {
    onAdd: addQuestionToExam.bind(null, exam.id),
    onRemove: removeQuestionFromExam.bind(null, exam.id),
    onMove: moveQuestion.bind(null, exam.id),
    onRegenerate: regenerateQuestion.bind(null, exam.id),
  };

  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/professor/provas" className="sidebar-link back-link">
            ← Minhas Provas
          </Link>
          <h1 className="page-title">{exam.title || "Prova sem título"}</h1>
          <div className="exam-meta">
            {exam.course && <span className="chip">{exam.course}</span>}
            {exam.style && <span className="chip">{exam.style}</span>}
            {exam.version > 1 && <span className="chip">Versão {exam.version}</span>}
            {exam.include_answer_key && <span className="chip">Com gabarito</span>}
            <span className="chip">{questions.length} questões</span>
            {exam.ai_provider && <AiBadge />}
          </div>
        </div>
        <div className="page-head-actions">
          <ExamExportActions examTitle={exam.title} questions={questions} includeAnswerKey={exam.include_answer_key} />
          <ExamHeaderMenu examId={exam.id} examTitle={exam.title || "Prova sem título"} />
        </div>
      </div>

      <QuestionsEditor kind="EXAM" parentId={exam.id} questions={questions} actions={questionsActions} shuffleOptions={exam.version > 1} />
    </>
  );
}
