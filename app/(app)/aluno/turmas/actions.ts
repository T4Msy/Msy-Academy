"use server";

import { revalidatePath } from "next/cache";
import { joinClassByInviteCode } from "@/lib/classes/join";

export async function joinClass(inviteCode: string): Promise<{ className: string }> {
  const result = await joinClassByInviteCode(inviteCode);
  revalidatePath("/aluno/turmas");
  revalidatePath("/aluno/tarefas");
  revalidatePath("/aluno/dashboard");
  return result;
}
