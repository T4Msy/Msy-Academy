"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/** Soft-delete via the SECURITY DEFINER RPC (migration 0005). */
export async function deleteQuestion(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("soft_delete_question", { p_question_id: id });
  if (error) throw new Error(`Não foi possível excluir: ${error.message}`);
}

/**
 * Reuses existing bank questions on an exam the caller owns (US-2.8).
 * `exam_questions_insert_own` (migration 0005) only checks the *exam*
 * belongs to the caller, not the question — by design, questions are
 * tenant-scoped, not per-exam, so any question already in this tenant's
 * bank is fair game to attach. Appends after the exam's current highest
 * `position` rather than reindexing existing rows.
 */
export async function addQuestionsToExam(examId: string, questionIds: string[]): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (questionIds.length === 0) throw new Error("Selecione ao menos uma questão.");

  const { data: lastRow } = await supabase
    .from("exam_questions")
    .select("position")
    .eq("exam_id", examId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextPosition = (lastRow?.position ?? 0) + 1;
  const rows = questionIds.map((question_id) => ({ exam_id: examId, question_id, position: nextPosition++ }));

  const { error } = await supabase.from("exam_questions").insert(rows);
  if (error) throw new Error(`Não foi possível adicionar as questões: ${error.message}`);

  revalidatePath(`/professor/provas/${examId}`);
  revalidatePath("/professor/banco-de-questoes");
}
