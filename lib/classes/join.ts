import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function joinClassByInviteCode(inviteCode: string): Promise<{ className: string }> {
  const code = inviteCode.trim().toUpperCase();
  if (!code) throw new Error("Informe o código da turma.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sua sessão terminou. Entre novamente para continuar.");

  const { data: classId, error } = await supabase.rpc("join_class_by_invite_code", {
    p_invite_code: code,
  });

  if (error || !classId) {
    if (error?.code === "23505") {
      throw new Error("Você já está matriculado nesta turma.");
    }
    throw new Error("Este código não foi encontrado ou a turma não está mais aceitando alunos.");
  }

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (!roles?.some((r) => r.role === "ALUNO")) {
    await supabase.from("user_roles").insert({ user_id: user.id, role: "ALUNO" });
  }

  const { data: klass } = await supabase.from("classes").select("name").eq("id", classId).single();
  return { className: klass?.name ?? "sua turma" };
}
