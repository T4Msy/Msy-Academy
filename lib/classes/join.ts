import "server-only";

import { createClient } from "@/lib/supabase/server";

export type JoinClassResult = {
  className: string;
  /** "ENROLLED": matriculado direto. "PENDING": turma exige aprovação do professor. */
  status: "ENROLLED" | "PENDING";
};

/**
 * join_class_by_invite_code now returns a row (class_id, class_name,
 * join_status) instead of a bare uuid — it ramifies internally on
 * classes.join_mode ('auto' | 'approval'), since the caller (a student) has
 * no SELECT on `classes` to check that beforehand. class_name comes from
 * the RPC directly: a student can't read `classes` themselves, so a
 * follow-up `.from("classes").select("name")` would silently return null.
 */
export async function joinClassByInviteCode(inviteCode: string): Promise<JoinClassResult> {
  const code = inviteCode.trim().toUpperCase();
  if (!code) throw new Error("Informe o código da turma.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sua sessão terminou. Entre novamente para continuar.");

  const { data, error } = await supabase.rpc("join_class_by_invite_code", {
    p_invite_code: code,
  });
  const row = data?.[0];

  if (error || !row) {
    if (error?.code === "23505") {
      throw new Error("Você já está matriculado nesta turma.");
    }
    throw new Error("Este código não foi encontrado ou a turma não está mais aceitando alunos.");
  }

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (!roles?.some((r) => r.role === "ALUNO")) {
    await supabase.from("user_roles").insert({ user_id: user.id, role: "ALUNO" });
  }

  return {
    className: row.class_name ?? "sua turma",
    status: row.join_status === "PENDING" ? "PENDING" : "ENROLLED",
  };
}
