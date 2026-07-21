import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ExamHeaderMenu } from "./ExamHeaderMenu";
import {
  QuestionsEditor,
  type QuestionsEditorActions,
} from "@/components/questions/QuestionsEditor";
import type { QuestionData } from "@/lib/questions/types";
import {
  addQuestionToExam,
  moveQuestion,
  regenerateQuestion,
  removeQuestionFromExam,
} from "../actions";
import { ExamExportActions } from "./ExamExportActions";
import { AiBadge } from "@/components/AiBadge";
import { ExamVariationDialog } from "./ExamVariationDialog";
import { SendExamToClass } from "./SendExamToClass";

export const dynamic = "force-dynamic";

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: exam }, { data: examQuestions }, { data: classes }] = await Promise.all([
    supabase
      .from("exams")
      .select(
        "id, title, course, style, include_answer_key, ai_provider, version, created_at, author_id",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("exam_questions")
      .select(
        "position, questions(id, type, statement, options, correct_answer, explanation, difficulty, tags)",
      )
      .eq("exam_id", id)
      .order("position"),
    supabase.from("classes").select("id, name").order("name"),
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
      return { ...q, bncc_codes: [], position: eq.position };
    });

  const questionsActions: QuestionsEditorActions = {
    onAdd: addQuestionToExam.bind(null, exam.id),
    onRemove: removeQuestionFromExam.bind(null, exam.id),
    onMove: moveQuestion.bind(null, exam.id),
    onRegenerate: regenerateQuestion.bind(null, exam.id),
  };
  const { data: existingAssignments } = await supabase.from("assignments").select("id, class_id").eq("content_type", "EXAM").eq("content_id", exam.id).is("deleted_at", null);
  const assignmentByClass = new Map((existingAssignments ?? []).map((assignment) => [assignment.class_id, assignment.id]));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/professor/provas"
            className="inline-flex items-center gap-2 pb-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Minhas Provas
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">
            {exam.title || "Prova sem título"}
          </h1>
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            {exam.course && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs whitespace-nowrap text-muted-foreground">
                {exam.course}
              </span>
            )}
            {exam.style && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs whitespace-nowrap text-muted-foreground">
                {exam.style}
              </span>
            )}
            {exam.version > 1 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs whitespace-nowrap text-muted-foreground">
                Versão {exam.version}
              </span>
            )}
            {exam.include_answer_key && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs whitespace-nowrap text-muted-foreground">
                Com gabarito
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs whitespace-nowrap text-muted-foreground">
              {questions.length} questões
            </span>
            {exam.ai_provider && <AiBadge />}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user?.id === exam.author_id && (
            <SendExamToClass examId={exam.id} examTitle={exam.title || "Prova sem título"} questionCount={questions.length} classes={(classes ?? []).map((klass) => ({ id: klass.id, name: klass.name, assignmentId: assignmentByClass.get(klass.id) }))} />
          )}
          {user?.id === exam.author_id && (
            <ExamVariationDialog
              examId={exam.id}
              examTitle={exam.title || "Prova sem título"}
              originalQuestions={questions}
            />
          )}
          <ExamExportActions
            examTitle={exam.title}
            questions={questions}
            includeAnswerKey={exam.include_answer_key}
          />
          <ExamHeaderMenu examId={exam.id} examTitle={exam.title || "Prova sem título"} />
        </div>
      </div>

      <QuestionsEditor
        kind="EXAM"
        parentId={exam.id}
        questions={questions}
        actions={questionsActions}
        shuffleOptions={exam.version > 1}
      />
    </>
  );
}
