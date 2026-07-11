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
