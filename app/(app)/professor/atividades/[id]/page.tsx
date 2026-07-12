import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RenameDeleteMenu } from "@/components/shell/RenameDeleteMenu";
import { AiBadge } from "@/components/AiBadge";
import { QuestionsEditor, type QuestionsEditorActions } from "@/components/questions/QuestionsEditor";
import type { QuestionData } from "@/lib/questions/types";
import {
  renameActivity,
  deleteActivity,
  addQuestionToActivity,
  removeQuestionFromActivity,
  moveQuestionInActivity,
  regenerateQuestionInActivity,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function AtividadePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: activity } = await supabase.from("activities").select("id, title, ai_provider, created_at").eq("id", id).single();
  if (!activity) notFound();

  const { data: items } = await supabase
    .from("activity_items")
    .select("position, questions(id, type, statement, options, correct_answer, explanation, difficulty, tags)")
    .eq("activity_id", id)
    .order("position");

  const questions: QuestionData[] = (items ?? [])
    .filter((item) => item.questions)
    .map((item) => {
      const q = item.questions as unknown as Omit<QuestionData, "position">;
      return { ...q, position: item.position };
    });

  const renameAction = renameActivity.bind(null, id);
  const deleteAction = deleteActivity.bind(null, id);

  const questionsActions: QuestionsEditorActions = {
    onAdd: addQuestionToActivity.bind(null, id),
    onRemove: removeQuestionFromActivity.bind(null, id),
    onMove: moveQuestionInActivity.bind(null, id),
    onRegenerate: regenerateQuestionInActivity.bind(null, id),
  };

  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/professor/biblioteca" className="sidebar-link" style={{ padding: "0 0 8px", display: "inline-block" }}>
            ← Biblioteca
          </Link>
          <h1 className="page-title">{activity.title}</h1>
          <div className="exam-meta">
            <span className="chip">{questions.length} questões</span>
            {activity.ai_provider && <AiBadge />}
          </div>
        </div>
        <RenameDeleteMenu currentTitle={activity.title} onRename={renameAction} onDelete={deleteAction} redirectAfterDelete="/professor/biblioteca" />
      </div>

      <QuestionsEditor kind="ACTIVITY" parentId={activity.id} questions={questions} actions={questionsActions} />
    </>
  );
}
