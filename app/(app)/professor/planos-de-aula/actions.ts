"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LessonPlanFormState } from "@/lib/lesson-plans/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function renameLessonPlan(id: string, theme: string): Promise<void> {
  const clean = theme.trim();
  if (!clean) return;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("lesson_plans").update({ theme: clean }).eq("id", id);
  if (error) throw new Error(`Não foi possível renomear: ${error.message}`);
  revalidatePath(`/professor/planos-de-aula/${id}`);
}

/** Soft-delete via the SECURITY DEFINER RPC (migration 0007). */
export async function deleteLessonPlan(id: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("soft_delete_lesson_plan", { p_lesson_plan_id: id });
  if (error) throw new Error(`Não foi possível excluir: ${error.message}`);
}

/** Criação manual — sem IA, todos os campos preenchidos pelo professor. */
export async function createLessonPlan(input: {
  theme: string;
  objectives?: string;
  content?: string;
  suggestedActivities?: string;
  suggestedAssessments?: string;
}): Promise<string> {
  const clean = input.theme.trim();
  if (!clean) throw new Error("Informe um tema para o plano de aula.");

  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) throw new Error("Perfil não encontrado.");

  const { data, error } = await supabase
    .from("lesson_plans")
    .insert({
      tenant_id: profile.tenant_id,
      author_id: user.id,
      theme: clean,
      objectives: input.objectives?.trim() || null,
      content: input.content?.trim() || null,
      suggested_activities: input.suggestedActivities?.trim() || null,
      suggested_assessments: input.suggestedAssessments?.trim() || null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Não foi possível criar o plano de aula: ${error?.message ?? "erro"}`);

  return data.id;
}

/**
 * Edita o corpo do plano de aula (tema continua só via RenameDeleteMenu,
 * mesmo padrão de Provas/Atividades). Retorna estado em vez de lançar —
 * mesmo motivo de updateProfile ([[nextjs-server-action-error-redaction]]).
 */
export async function updateLessonPlan(
  id: string,
  _prevState: LessonPlanFormState | null,
  formData: FormData,
): Promise<LessonPlanFormState> {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("lesson_plans")
    .update({
      objectives: String(formData.get("objectives") ?? "").trim() || null,
      content: String(formData.get("content") ?? "").trim() || null,
      suggested_activities: String(formData.get("suggested_activities") ?? "").trim() || null,
      suggested_assessments: String(formData.get("suggested_assessments") ?? "").trim() || null,
    })
    .eq("id", id);
  if (error) return { error: `Não foi possível salvar: ${error.message}` };

  revalidatePath(`/professor/planos-de-aula/${id}`);
  return { ok: true };
}
