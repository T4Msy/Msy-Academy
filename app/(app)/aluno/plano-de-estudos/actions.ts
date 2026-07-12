"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function toggleStudyItem(itemId: string, planId: string, done: boolean): Promise<void> {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("study_plan_items")
    .update({ status: done ? "DONE" : "PENDING" })
    .eq("id", itemId);
  if (error) throw new Error(`Não foi possível atualizar: ${error.message}`);

  revalidatePath(`/aluno/plano-de-estudos/${planId}`);
}

/** Criação manual — plano em branco, sem IA; itens adicionados depois via createStudyItem. */
export async function createBlankStudyPlan(goal: string, examDate?: string): Promise<string> {
  const clean = goal.trim();
  if (!clean) throw new Error("Informe um objetivo para o plano.");

  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) throw new Error("Perfil não encontrado.");

  const { data, error } = await supabase
    .from("study_plans")
    .insert({ tenant_id: profile.tenant_id, student_id: user.id, goal: clean, exam_date: examDate || null })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Não foi possível criar o plano: ${error?.message ?? "erro"}`);

  return data.id;
}

export async function renameStudyPlan(planId: string, goal: string): Promise<void> {
  const clean = goal.trim();
  if (!clean) return;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("study_plans").update({ goal: clean }).eq("id", planId);
  if (error) throw new Error(`Não foi possível renomear: ${error.message}`);
  revalidatePath(`/aluno/plano-de-estudos/${planId}`);
}

/** Soft-delete via RPC (migration 0021). */
export async function deleteStudyPlan(planId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("soft_delete_study_plan", { p_study_plan_id: planId });
  if (error) throw new Error(`Não foi possível excluir o plano: ${error.message}`);
  revalidatePath("/aluno/plano-de-estudos");
}

export async function createStudyItem(
  planId: string,
  input: { item_date: string; topic: string; item_type: "REVISAO" | "EXERCICIO" | "LEITURA" },
): Promise<void> {
  const clean = input.topic.trim();
  if (!clean || !input.item_date) throw new Error("Preencha a data e o tópico.");

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("study_plan_items")
    .insert({ study_plan_id: planId, item_date: input.item_date, topic: clean, item_type: input.item_type });
  if (error) throw new Error(`Não foi possível criar o item: ${error.message}`);

  revalidatePath(`/aluno/plano-de-estudos/${planId}`);
}

export async function updateStudyItem(
  itemId: string,
  planId: string,
  input: { item_date: string; topic: string; item_type: "REVISAO" | "EXERCICIO" | "LEITURA" },
): Promise<void> {
  const clean = input.topic.trim();
  if (!clean || !input.item_date) throw new Error("Preencha a data e o tópico.");

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("study_plan_items")
    .update({ item_date: input.item_date, topic: clean, item_type: input.item_type })
    .eq("id", itemId);
  if (error) throw new Error(`Não foi possível salvar o item: ${error.message}`);

  revalidatePath(`/aluno/plano-de-estudos/${planId}`);
}

/** DELETE físico direto (migration 0021) — study_plan_items não tem deleted_at. */
export async function deleteStudyItem(itemId: string, planId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("study_plan_items").delete().eq("id", itemId);
  if (error) throw new Error(`Não foi possível excluir o item: ${error.message}`);

  revalidatePath(`/aluno/plano-de-estudos/${planId}`);
}
