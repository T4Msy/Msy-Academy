"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (!(roles ?? []).some((r) => r.role === "ADMIN")) redirect("/");
}

/** Suspends or reinstates a user. Suspended users are blocked in app/(app)/layout.tsx. */
export async function toggleSuspend(userId: string, suspend: boolean): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ suspended_at: suspend ? new Date().toISOString() : null })
    .eq("id", userId);
  if (error) throw new Error(`Não foi possível atualizar: ${error.message}`);
  revalidatePath("/admin/usuarios");
}

/**
 * ADMIN is the one role users can never self-assign (RLS blocks it in
 * onboarding by design, see 0004_role_onboarding.sql) — this is the only
 * legitimate way to grant/revoke it. PROFESSOR/ALUNO stay self-service via
 * onboarding, not duplicated here.
 */
export async function toggleAdminRole(userId: string, grant: boolean): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  if (grant) {
    const { error } = await admin.from("user_roles").insert({ user_id: userId, role: "ADMIN" });
    if (error) throw new Error(`Não foi possível conceder admin: ${error.message}`);
  } else {
    const { error } = await admin.from("user_roles").delete().eq("user_id", userId).eq("role", "ADMIN");
    if (error) throw new Error(`Não foi possível remover admin: ${error.message}`);
  }
  revalidatePath("/admin/usuarios");
}
