"use server";

import { revalidatePath } from "next/cache";
import { joinClassByInviteCode, type JoinClassResult } from "@/lib/classes/join";

export async function joinClass(inviteCode: string): Promise<JoinClassResult> {
  const result = await joinClassByInviteCode(inviteCode);
  // Sem efeito quando status === "PENDING" (nenhuma matrícula foi criada
  // ainda), mas revalidar é inofensivo — mantém uma única chamada simples.
  revalidatePath("/aluno/turmas");
  revalidatePath("/aluno/tarefas");
  revalidatePath("/aluno/dashboard");
  return result;
}
