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

async function requireClassOwner(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, classId: string) {
  const { data: classroom } = await supabase.from("classes").select("owner_id").eq("id", classId).maybeSingle();
  if (!classroom || classroom.owner_id !== userId) throw new Error("Você não possui permissão para modificar esta turma.");
}

/** Gera um novo código, invalidando o antigo (o link de convite usa o mesmo código). */
export async function regenerateInviteCode(classId: string): Promise<string> {
  const { supabase, user } = await requireUser();
  await requireClassOwner(supabase, user.id, classId);
  const { data, error } = await supabase.rpc("regenerate_class_invite_code", { p_class_id: classId });
  if (error || !data) throw new Error(`Não foi possível gerar um novo código: ${error?.message}`);
  revalidatePath(`/professor/turmas/${classId}/configuracoes`);
  return data as string;
}

export async function setJoinMode(classId: string, joinMode: "auto" | "approval"): Promise<void> {
  const { supabase, user } = await requireUser();
  await requireClassOwner(supabase, user.id, classId);
  const { error } = await supabase.rpc("set_class_join_mode", { p_class_id: classId, p_join_mode: joinMode });
  if (error) throw new Error(`Não foi possível atualizar o modo de entrada: ${error.message}`);
  revalidatePath(`/professor/turmas/${classId}/configuracoes`);
}

export async function approveJoinRequest(classId: string, requestId: string): Promise<void> {
  const { supabase, user } = await requireUser();
  await requireClassOwner(supabase, user.id, classId);
  const { error } = await supabase.rpc("approve_join_request", { p_request_id: requestId });
  if (error) throw new Error(`Não foi possível aprovar a solicitação: ${error.message}`);
  revalidatePath(`/professor/turmas/${classId}/configuracoes`);
  revalidatePath(`/professor/turmas/${classId}/alunos`);
}

export async function rejectJoinRequest(classId: string, requestId: string): Promise<void> {
  const { supabase, user } = await requireUser();
  await requireClassOwner(supabase, user.id, classId);
  const { error } = await supabase.rpc("reject_join_request", { p_request_id: requestId });
  if (error) throw new Error(`Não foi possível rejeitar a solicitação: ${error.message}`);
  revalidatePath(`/professor/turmas/${classId}/configuracoes`);
}
