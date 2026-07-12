"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "PROFESSOR" | "ALUNO";

export interface AddRoleState {
  error?: string;
  ok?: boolean;
}

/**
 * Lets a user who chose only one role at onboarding activate the other
 * environment later, from Configurações. Same insert `completeOnboarding`
 * (app/onboarding/actions.ts) does, extracted here so both call sites share
 * one code path — RLS (`user_roles_insert_own`, migration 0004) still
 * restricts this to PROFESSOR/ALUNO for the caller's own user_id.
 *
 * Returns state instead of throwing, same reasoning as the rest of
 * lib/settings/actions.ts ([[nextjs-server-action-error-redaction]]).
 */
export async function addRoleToCurrentUser(_prevState: AddRoleState | null, formData: FormData): Promise<AddRoleState> {
  const role = formData.get("role") as Role | null;
  if (role !== "PROFESSOR" && role !== "ALUNO") return { error: "Papel inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role });
  if (error) {
    if (error.code === "23505") return { ok: true }; // already has this role — nothing to do
    return { error: `Não foi possível ativar esse ambiente: ${error.message}` };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
