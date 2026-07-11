"use server";

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
