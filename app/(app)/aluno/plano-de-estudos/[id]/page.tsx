import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StudyItemsList, type StudyItem } from "./StudyItemsList";
import { EmptyIllustration } from "@/components/EmptyIllustration";

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

  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/aluno/plano-de-estudos" className="sidebar-link" style={{ padding: "0 0 8px", display: "inline-block" }}>
            ← Plano de Estudos
          </Link>
          <h1 className="page-title">{plan.goal}</h1>
          <div className="exam-meta">
            <span className="chip">{doneCount}/{list.length} concluídos</span>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <EmptyIllustration variant="plano" />
          <div className="empty-title">Sem itens</div>
          <p className="empty-text">Este plano não tem itens de estudo.</p>
        </div>
      ) : (
        <StudyItemsList planId={id} items={list} />
      )}
    </>
  );
}
