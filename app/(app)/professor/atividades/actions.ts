"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addLinkedQuestion,
  moveLinkedQuestion,
  regenerateLinkedQuestion,
  removeLinkedQuestion,
} from "@/lib/questions/linkedQuestions";
import type { NewQuestionInput } from "@/lib/questions/types";

const LINK_CONFIG = (activityId: string) => ({
  linkTable: "activity_items" as const,
  parentColumn: "activity_id" as const,
  parentId: activityId,
});

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function renameActivity(id: string, title: string): Promise<void> {
  const clean = title.trim();
  if (!clean) return;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("activities").update({ title: clean }).eq("id", id);
  if (error) throw new Error(`Não foi possível renomear: ${error.message}`);
  revalidatePath(`/professor/atividades/${id}`);
}

/** Soft-delete via the SECURITY DEFINER RPC (migration 0007). */
export async function deleteActivity(id: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("soft_delete_activity", { p_activity_id: id });
  if (error) throw new Error(`Não foi possível excluir: ${error.message}`);
}

/** Criação manual — atividade em branco, questões adicionadas depois via addQuestionToActivity. */
export async function createBlankActivity(title: string): Promise<string> {
  const clean = title.trim();
  if (!clean) throw new Error("Informe um título para a atividade.");

  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) throw new Error("Perfil não encontrado.");

  const { data, error } = await supabase
    .from("activities")
    .insert({ tenant_id: profile.tenant_id, author_id: user.id, title: clean })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Não foi possível criar a atividade: ${error?.message ?? "erro"}`);

  return data.id;
}

/** Cria uma questão nova e anexa ao final da atividade. */
export async function addQuestionToActivity(activityId: string, input: NewQuestionInput): Promise<void> {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) throw new Error("Perfil não encontrado.");

  await addLinkedQuestion(supabase, LINK_CONFIG(activityId), input, profile.tenant_id, user.id);
  revalidatePath(`/professor/atividades/${activityId}`);
}

/** Desvincula a questão da atividade — a questão continua no Banco de Questões. */
export async function removeQuestionFromActivity(activityId: string, questionId: string): Promise<void> {
  const { supabase } = await requireUser();
  await removeLinkedQuestion(supabase, LINK_CONFIG(activityId), questionId);
  revalidatePath(`/professor/atividades/${activityId}`);
}

/** Swap a question's position with its neighbor within the same activity. */
export async function moveQuestionInActivity(activityId: string, questionId: string, direction: "up" | "down"): Promise<void> {
  const { supabase } = await requireUser();
  await moveLinkedQuestion(supabase, LINK_CONFIG(activityId), questionId, direction);
  revalidatePath(`/professor/atividades/${activityId}`);
}

/** Regenerate a single question via the AI orchestrator, mesmo tipo/dificuldade da original. */
export async function regenerateQuestionInActivity(activityId: string, questionId: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();

  const { data: activity, error: activityErr } = await supabase
    .from("activities")
    .select("tenant_id, generation_params")
    .eq("id", activityId)
    .single();
  if (activityErr || !activity) return { error: "Atividade não encontrada." };

  const result = await regenerateLinkedQuestion(
    supabase,
    questionId,
    (activity.generation_params as object) ?? {},
    "ACTIVITY_GEN",
    activity.tenant_id,
    user.id,
  );
  if (result.error) return result;

  revalidatePath(`/professor/atividades/${activityId}`);
  return {};
}
