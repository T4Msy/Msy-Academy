"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const TUTOR_PATH = "/aluno/tutor-ia";

async function requireStudent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sua sessão terminou. Entre novamente para continuar.");
  return supabase;
}

export async function renameTutorConversation(
  conversationId: string,
  title: string,
): Promise<void> {
  const cleanTitle = title.trim().replace(/\s+/g, " ");
  if (!cleanTitle || cleanTitle.length > 80) {
    throw new Error("O título precisa ter entre 1 e 80 caracteres.");
  }

  const supabase = await requireStudent();
  const { data, error } = await supabase
    .from("tutor_conversations")
    .update({ title: cleanTitle })
    .eq("id", conversationId)
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error("Não foi possível renomear esta conversa.");
  revalidatePath(TUTOR_PATH);
}

export async function deleteTutorConversation(conversationId: string): Promise<void> {
  const supabase = await requireStudent();
  const { data, error } = await supabase
    .from("tutor_conversations")
    .delete()
    .eq("id", conversationId)
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error("Não foi possível excluir esta conversa.");
  revalidatePath(TUTOR_PATH);
}
