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

/** Removes only the enrollment row. The student user/account is never touched. */
export async function removeStudentFromClass(classId: string, studentId: string): Promise<void> {
  const { supabase, user } = await requireUser();
  await requireClassOwner(supabase, user.id, classId);
  const { error } = await supabase.rpc("remove_student_from_class", {
    p_class_id: classId,
    p_student_id: studentId,
  });
  if (error) throw new Error(`Não foi possível remover o aluno: ${error.message}`);

  revalidatePath(`/professor/turmas/${classId}/alunos`);
}
