"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/** Update the caller's display name. RLS (`profiles_update_own`) enforces ownership. */
export async function updateProfile(fullName: string): Promise<void> {
  const clean = fullName.trim();
  if (!clean) throw new Error("O nome não pode ficar vazio.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: clean })
    .eq("id", user.id);

  if (error) throw new Error(`Não foi possível salvar: ${error.message}`);

  // Topbar reads full_name from each environment layout's own fetch — refresh it.
  revalidatePath("/", "layout");
}

/**
 * Self-service account deletion (LGPD — direito de exclusão). Deletes the
 * auth user, which cascades (on delete cascade) through every table that
 * references auth.users directly: profile, exams, classes, submissions,
 * study plans, flashcard decks, etc. The one thing that does NOT cascade
 * from auth.users is public.tenants (tenants has no FK back to the user) —
 * so it's deleted explicitly here, but only when this user is the tenant's
 * sole member, since a tenant can in principle outlive any one profile.
 */
export async function deleteMyAccount(confirmation: string): Promise<void> {
  if (confirmation.trim().toUpperCase() !== "EXCLUIR") {
    throw new Error('Digite "EXCLUIR" para confirmar.');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: profile } = await admin.from("profiles").select("tenant_id").eq("id", user.id).single();

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteUserError) throw new Error(`Não foi possível excluir a conta: ${deleteUserError.message}`);

  if (profile?.tenant_id) {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", profile.tenant_id);
    if (!count) {
      await admin.from("tenants").delete().eq("id", profile.tenant_id);
    }
  }

  await supabase.auth.signOut();
  redirect("/login?message=" + encodeURIComponent("Sua conta foi excluída."));
}
