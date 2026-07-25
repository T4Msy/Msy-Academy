import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RenameDeleteMenu } from "@/components/shell/RenameDeleteMenu";
import { AiBadge } from "@/components/AiBadge";
import { ActivityActions } from "./ActivityActions";
import { SendActivityToClass } from "./SendActivityToClass";
import { ExamExportActions } from "../../provas/[id]/ExamExportActions";
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

  const modernActivity = await supabase.from("activities").select("id, title, description, ai_provider, origin, status, created_at, generation_params").eq("id", id).maybeSingle();
  let activity = modernActivity.data;
  if (modernActivity.error && (modernActivity.error.code === "42703" || modernActivity.error.code === "PGRST204" || /column .* does not exist/i.test(modernActivity.error.message))) {
    const legacyActivity = await supabase.from("activities").select("id, title, ai_provider, status, created_at, generation_params").eq("id", id).maybeSingle();
    if (legacyActivity.error) throw new Error("Não foi possível carregar a atividade. Tente novamente.");
    activity = legacyActivity.data ? { ...legacyActivity.data, description: null, origin: legacyActivity.data.ai_provider ? "ai" : "manual" } : null;
  } else if (modernActivity.error) {
    throw new Error("Não foi possível carregar a atividade. Tente novamente.");
  }
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
      return { ...q, bncc_codes: [], position: item.position };
    });

  const [{ data: classes }, { data: assignments }] = await Promise.all([
    supabase.from("classes").select("id, name").order("name"),
    supabase.from("assignments").select("id, class_id, due_at, audience_type").eq("content_type", "ACTIVITY").eq("content_id", id).is("deleted_at", null),
  ]);
  const classIds = (classes ?? []).map((item) => item.id);
  const { data: enrollments } = classIds.length ? await supabase.from("enrollments").select("class_id, student_id").in("class_id", classIds).eq("status", "ACTIVE") : { data: [] as { class_id: string; student_id: string }[] };
  const studentIds = [...new Set((enrollments ?? []).map((item) => item.student_id))];
  const { data: profiles } = studentIds.length ? await supabase.from("profiles").select("id, full_name").in("id", studentIds) : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
  const studentsByClass = (enrollments ?? []).reduce<Record<string, { id: string; name: string | null }[]>>((map, item) => { (map[item.class_id] ??= []).push({ id: item.student_id, name: nameById.get(item.student_id) ?? null }); return map; }, {});

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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/professor/atividades" className="inline-flex items-center gap-2 pb-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            ← Biblioteca
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">{activity.title}</h1>
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{questions.length} questões</span>
            {(activity.origin === "ai" || activity.ai_provider) ? <AiBadge /> : <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">Criada manualmente</span>}
            <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{activity.status === "DRAFT" ? "Rascunho" : "Pronta"}</span>
            <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{assignments?.length ?? 0} atribuiÃ§Ã£o{assignments?.length === 1 ? "" : "Ãµes"}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2"><SendActivityToClass activityId={activity.id} classes={classes ?? []} studentsByClass={studentsByClass} /><ActivityActions activityId={activity.id} /><ExamExportActions examTitle={activity.title} questions={questions} includeAnswerKey={false} /><RenameDeleteMenu currentTitle={activity.title} onRename={renameAction} onDelete={deleteAction} redirectAfterDelete="/professor/atividades" /></div>
      </div>

      <QuestionsEditor kind="ACTIVITY" parentId={activity.id} questions={questions} actions={questionsActions} />
    </>
  );
}
