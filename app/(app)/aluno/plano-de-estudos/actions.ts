"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function toggleStudyItem(itemId: string, planId: string, done: boolean): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("study_plan_items")
    .update({ status: done ? "DONE" : "PENDING" })
    .eq("id", itemId);
  if (error) throw new Error(`Não foi possível atualizar: ${error.message}`);

  revalidatePath(`/aluno/plano-de-estudos/${planId}`);
}
