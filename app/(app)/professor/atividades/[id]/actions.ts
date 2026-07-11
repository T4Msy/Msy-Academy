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
