"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Joins the class behind an invite code via the SECURITY DEFINER RPC
 * (migration 0007), and grants ALUNO role if the user doesn't have it yet —
 * covers both the fresh-signup path (already onboarded via the redirect
 * chain in middleware/onboarding) and a professor joining a colleague's
 * class as a student.
 */
export async function joinClass(inviteCode: string): Promise<{ className: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: classId, error } = await supabase.rpc("join_class_by_invite_code", {
    p_invite_code: inviteCode,
  });
  if (error || !classId) throw new Error("Código de convite inválido ou expirado.");

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (!roles?.some((r) => r.role === "ALUNO")) {
    await supabase.from("user_roles").insert({ user_id: user.id, role: "ALUNO" });
  }

  const { data: klass } = await supabase.from("classes").select("name").eq("id", classId).single();
  return { className: klass?.name ?? "sua turma" };
}
