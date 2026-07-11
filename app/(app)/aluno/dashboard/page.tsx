import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StatRing } from "@/components/charts/StatRing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

export default async function AlunoDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, status")
    .eq("student_id", user!.id);
  const submissionIds = (submissions ?? []).map((s) => s.id);

  const { data: answers } = submissionIds.length
    ? await supabase.from("submission_answers").select("is_correct").in("submission_id", submissionIds)
    : { data: [] as { is_correct: boolean | null }[] };

  const graded = (answers ?? []).filter((a) => a.is_correct !== null);
  const correctCount = graded.filter((a) => a.is_correct).length;
  const accuracyPct = graded.length > 0 ? Math.round((correctCount / graded.length) * 100) : null;

  const { data: studyPlans } = await supabase.from("study_plans").select("id").eq("student_id", user!.id);
  const planIds = (studyPlans ?? []).map((p) => p.id);
  const { data: studyItems } = planIds.length
    ? await supabase.from("study_plan_items").select("status").in("study_plan_id", planIds)
    : { data: [] as { status: string }[] };
  const doneItems = (studyItems ?? []).filter((i) => i.status === "DONE").length;

  const { data: decks } = await supabase.from("flashcard_decks").select("id").eq("student_id", user!.id);

  const completedCount = (submissions ?? []).filter((s) => s.status !== "PENDING").length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Sua evolução, desempenho e metas.</p>
        </div>
      </div>

      <div className="quick-actions-grid">
        <div className="card">
          <div className="card-body">
            <div className="card-title">Tarefas concluídas</div>
            <p className="question-statement" style={{ fontSize: 28, fontFamily: "var(--font-display)", fontWeight: 800, marginTop: 8, marginBottom: 0 }}>
              {completedCount}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <StatRing value={accuracyPct} label="Acerto em objetivas" size={72} strokeWidth={7} />
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="card-title">Itens de estudo concluídos</div>
            <p className="question-statement" style={{ fontSize: 28, fontFamily: "var(--font-display)", fontWeight: 800, marginTop: 8, marginBottom: 0 }}>
              {doneItems}/{studyItems?.length ?? 0}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="card-title">Decks de flashcards</div>
            <p className="question-statement" style={{ fontSize: 28, fontFamily: "var(--font-display)", fontWeight: 800, marginTop: 8, marginBottom: 0 }}>
              {decks?.length ?? 0}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
