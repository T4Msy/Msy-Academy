"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Role = "PROFESSOR" | "ALUNO";

/**
 * Completes onboarding by inserting the chosen role(s) into user_roles.
 * RLS (`user_roles_insert_own`, migration 0004) restricts this to
 * PROFESSOR/ALUNO for the caller's own user_id — a client can never
 * self-grant ADMIN this way, even if it tried to call this action directly.
 */
function safeRedirect(target: string | null | undefined): string | null {
  if (target && target.startsWith("/") && !target.startsWith("//")) return target;
  return null;
}

export async function completeOnboarding(roles: Role[], redirectTo?: string | null): Promise<void> {
  if (roles.length === 0) {
    throw new Error("Escolha ao menos um papel para continuar.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("user_roles")
    .insert(roles.map((role) => ({ user_id: user.id, role })));

  if (error) throw new Error(`Não foi possível salvar seu papel: ${error.message}`);

  revalidatePath("/", "layout");
  // Honor a pending destination (e.g. a class invite link) instead of the
  // default shell, so a brand-new user who clicked "/entrar/CODE" actually
  // lands back there after choosing a role.
  redirect(safeRedirect(redirectTo) ?? (roles.includes("PROFESSOR") ? "/professor" : "/aluno"));
}
