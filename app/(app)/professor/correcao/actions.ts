"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/ai/orchestrator";
import { GRADING_SCHEMA_V1 } from "@/lib/ai/prompts/grading.v1";
import type { GradingSuggestion } from "@/lib/ai/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/** RF-P23 — AI-suggested nota+feedback for one discursive answer. Never auto-saved — the professor reviews it. */
export async function suggestGrade(
  submissionId: string,
  statement: string,
  referenceAnswer: string,
  studentAnswer: string,
): Promise<GradingSuggestion> {
  const { supabase, user } = await requireUser();

  const { data: submission } = await supabase
    .from("submissions")
    .select("assignment_id, assignments(tenant_id)")
    .eq("id", submissionId)
    .single();
  const tenantId = (submission?.assignments as unknown as { tenant_id: string } | null)?.tenant_id;
  if (!tenantId) throw new Error("Envio não encontrado.");

  return generateStructured<GradingSuggestion>({
    task: "GRADING",
    schema: GRADING_SCHEMA_V1,
    input: { statement, referenceAnswer, studentAnswer },
    tenantId,
    userId: user.id,
  });
}

/** Saves the final grade (teacher-reviewed, whether AI-assisted or manual) and flips the submission to GRADED. */
export async function saveGrade(
  submissionId: string,
  totalScore: number,
  feedback: string,
  gradedBy: "AI_SUGGESTED" | "TEACHER",
): Promise<void> {
  const { supabase } = await requireUser();

  const { error: gradeErr } = await supabase
    .from("grades")
    .upsert({ submission_id: submissionId, total_score: totalScore, feedback, graded_by: gradedBy }, { onConflict: "submission_id" });
  if (gradeErr) throw new Error(`Não foi possível salvar a nota: ${gradeErr.message}`);

  const { error: rpcErr } = await supabase.rpc("mark_submission_graded", { p_submission_id: submissionId });
  if (rpcErr) throw new Error(`Não foi possível concluir a correção: ${rpcErr.message}`);

  revalidatePath("/professor/correcao");
  revalidatePath(`/professor/correcao/${submissionId}`);
}
