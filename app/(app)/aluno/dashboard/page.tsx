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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Meu Progresso</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Sua evolução, desempenho e metas.</p>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
          <div className="flex flex-col gap-4.5 p-5.5">
            <div className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Tarefas concluídas</div>
            <p className="mt-2 font-display text-[28px] font-extrabold">{completedCount}</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
          <div className="flex flex-col gap-4.5 p-5.5">
            <StatRing value={accuracyPct} label="Acerto em objetivas" size={72} strokeWidth={7} />
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
          <div className="flex flex-col gap-4.5 p-5.5">
            <div className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Itens de estudo concluídos</div>
            <p className="mt-2 font-display text-[28px] font-extrabold">
              {doneItems}/{studyItems?.length ?? 0}
            </p>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
          <div className="flex flex-col gap-4.5 p-5.5">
            <div className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Decks de flashcards</div>
            <p className="mt-2 font-display text-[28px] font-extrabold">{decks?.length ?? 0}</p>
          </div>
        </div>
      </div>
    </>
  );
}
