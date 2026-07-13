import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RenameDeleteMenu } from "@/components/shell/RenameDeleteMenu";
import { StudyItemsList, type StudyItem } from "./StudyItemsList";
import { renameStudyPlan, deleteStudyPlan } from "../actions";

export const dynamic = "force-dynamic";

export default async function StudyPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: plan } = await supabase.from("study_plans").select("id, goal, exam_date").eq("id", id).single();
  if (!plan) notFound();

  const { data: items } = await supabase
    .from("study_plan_items")
    .select("id, item_date, topic, item_type, status")
    .eq("study_plan_id", id)
    .order("item_date");

  const list = (items ?? []) as StudyItem[];
  const doneCount = list.filter((i) => i.status === "DONE").length;

  const renameAction = renameStudyPlan.bind(null, id);
  const deleteAction = deleteStudyPlan.bind(null, id);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/aluno/plano-de-estudos" className="inline-flex items-center gap-2 pb-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            ← Plano de Estudos
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">{plan.goal}</h1>
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{doneCount}/{list.length} concluídos</span>
          </div>
        </div>
        <RenameDeleteMenu currentTitle={plan.goal} onRename={renameAction} onDelete={deleteAction} redirectAfterDelete="/aluno/plano-de-estudos" />
      </div>

      <StudyItemsList planId={id} items={list} />
    </>
  );
}
