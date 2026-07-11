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
 * auth user, which cascades (on delete cascade) through most tables that
 * reference auth.users directly: profile, exams, classes, submissions,
 * study plans, flashcard decks, etc. (ai_usage is the one exception —
 * `on delete set null`, kept for billing/audit history, not deleted). The
 * other thing that does NOT cascade from auth.users is public.tenants
 * (tenants has no FK back to the user) — so it's deleted explicitly here,
 * but only when this user is confirmed to be the tenant's sole member.
 *
 * Errors redirect back to `returnPath` with a query-string message instead
 * of throwing, and the terminal success redirect is a plain form-action
 * redirect (this must be invoked as `<form action={...}>`, never called
 * imperatively and wrapped in a client try/catch) — both deliberate, per
 * [[nextjs-server-action-error-redaction]]: a thrown Server Action error is
 * redacted to a generic message in `next build`/`next start`, and a
 * redirect() thrown inside a client-side try/catch is caught as a regular
 * error instead of navigating.
 */
export async function deleteMyAccount(returnPath: string, formData: FormData): Promise<void> {
  const confirmation = String(formData.get("confirmation") ?? "");
  if (confirmation.trim().toUpperCase() !== "EXCLUIR") {
    redirect(`${returnPath}?deleteError=${encodeURIComponent('Digite "EXCLUIR" para confirmar.')}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: profile } = await admin.from("profiles").select("tenant_id").eq("id", user.id).single();

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteUserError) {
    redirect(`${returnPath}?deleteError=${encodeURIComponent("Não foi possível excluir a conta. Tente novamente.")}`);
  }

  if (profile?.tenant_id) {
    const { count, error: countError } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", profile.tenant_id);
    // Fail safe: only delete the tenant when the remaining-member count is
    // known and zero. A failed count query must never be treated as "no
    // other members" — that could wipe out a tenant shared with someone
    // else over a transient error.
    if (!countError && !count) {
      await admin.from("tenants").delete().eq("id", profile.tenant_id);
    }
  }

  await supabase.auth.signOut();
  redirect("/login?message=" + encodeURIComponent("Sua conta foi excluída."));
}
