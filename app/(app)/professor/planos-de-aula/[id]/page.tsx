import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RenameDeleteMenu } from "@/components/shell/RenameDeleteMenu";
import { AiBadge } from "@/components/AiBadge";
import { LessonPlanEditor } from "@/components/lesson-plans/LessonPlanEditor";
import { renameLessonPlan, deleteLessonPlan, updateLessonPlan } from "../actions";

export const dynamic = "force-dynamic";

export default async function PlanoDeAulaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("lesson_plans")
    .select("id, theme, objectives, content, suggested_activities, suggested_assessments, ai_provider, created_at")
    .eq("id", id)
    .single();
  if (!plan) notFound();

  const renameAction = renameLessonPlan.bind(null, id);
  const deleteAction = deleteLessonPlan.bind(null, id);
  const saveAction = updateLessonPlan.bind(null, id);

  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/professor/biblioteca" className="sidebar-link" style={{ padding: "0 0 8px", display: "inline-block" }}>
            ← Biblioteca
          </Link>
          <h1 className="page-title">{plan.theme}</h1>
          {plan.ai_provider && (
            <div className="exam-meta">
              <AiBadge />
            </div>
          )}
        </div>
        <RenameDeleteMenu currentTitle={plan.theme} onRename={renameAction} onDelete={deleteAction} redirectAfterDelete="/professor/biblioteca" />
      </div>

      <LessonPlanEditor
        plan={{
          objectives: plan.objectives,
          content: plan.content,
          suggested_activities: plan.suggested_activities,
          suggested_assessments: plan.suggested_assessments,
        }}
        action={saveAction}
      />
    </>
  );
}
