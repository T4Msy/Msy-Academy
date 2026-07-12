import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StatRing } from "@/components/charts/StatRing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Meu Progresso" };

export default async function AlunoDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: submissions }, { data: studyPlans }, { data: decks }] = await Promise.all([
    supabase.from("submissions").select("id, status").eq("student_id", user!.id),
    supabase.from("study_plans").select("id").eq("student_id", user!.id),
    supabase.from("flashcard_decks").select("id").eq("student_id", user!.id),
  ]);

  const submissionIds = (submissions ?? []).map((s) => s.id);
  const planIds = (studyPlans ?? []).map((p) => p.id);

  const [{ data: answers }, { data: studyItems }] = await Promise.all([
    submissionIds.length
      ? supabase.from("submission_answers").select("is_correct").in("submission_id", submissionIds)
      : Promise.resolve({ data: [] as { is_correct: boolean | null }[] }),
    planIds.length
      ? supabase.from("study_plan_items").select("status").in("study_plan_id", planIds)
      : Promise.resolve({ data: [] as { status: string }[] }),
  ]);

  const graded = (answers ?? []).filter((a) => a.is_correct !== null);
  const correctCount = graded.filter((a) => a.is_correct).length;
  const accuracyPct = graded.length > 0 ? Math.round((correctCount / graded.length) * 100) : null;
  const doneItems = (studyItems ?? []).filter((i) => i.status === "DONE").length;

  const completedCount = (submissions ?? []).filter((s) => s.status !== "PENDING").length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Meu Progresso</h1>
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
