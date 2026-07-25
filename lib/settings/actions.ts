"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { validateProfileInput } from "@/lib/settings/profileValidation";

export interface UpdateProfileState {
  error?: string;
  ok?: boolean;
  warning?: string;
}

export interface AvatarState {
  error?: string;
  ok?: boolean;
}

/**
 * Update the caller's display name. RLS (`profiles_update_own`) enforces
 * ownership. Returns state instead of throwing — a thrown Server Action
 * error is redacted to a generic message in `next build`/`next start`
 * ([[nextjs-server-action-error-redaction]]), which would silently swallow
 * validation messages like "O nome não pode ficar vazio."
 */
export async function updateProfile(_prevState: UpdateProfileState | null, formData: FormData): Promise<UpdateProfileState> {
  const values = {
    fullName: String(formData.get("full_name") ?? ""),
    displayName: String(formData.get("display_name") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    institution: String(formData.get("institution") ?? ""),
    discipline: String(formData.get("discipline") ?? ""),
    gradeInterest: String(formData.get("grade_interest") ?? ""),
    studyGoal: String(formData.get("study_goal") ?? ""),
    showAvatar: formData.get("show_avatar") === "on",
  };
  const validationError = validateProfileInput(values);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Explicit allow-list: protected fields (role, e-mail, plan, quotas and id)
  // can never be changed by this form.
  const { error } = await supabase.from("profiles").update({
    full_name: values.fullName.trim(),
    display_name: values.displayName.trim() || null,
    bio: values.bio.trim() || null,
    institution: values.institution.trim() || null,
    discipline: values.discipline.trim() || null,
    grade_interest: values.gradeInterest.trim() || null,
    study_goal: values.studyGoal.trim() || null,
    show_avatar: values.showAvatar,
  }).eq("id", user.id);

  if (error) {
    // The migration is deployable independently from the app. Keep the
    // original profile usable if optional columns are not deployed yet.
    if (error.code === "42703" || /column .* does not exist/i.test(error.message)) {
      const { error: baseError } = await supabase.from("profiles").update({ full_name: values.fullName.trim() }).eq("id", user.id);
      if (baseError) return { error: "Não conseguimos salvar suas alterações. Tente novamente." };
      revalidatePath("/", "layout");
      return { ok: true, warning: "Seu nome foi salvo. Os demais campos estarão disponíveis após a atualização do perfil." };
    }
    return { error: "Não conseguimos salvar suas alterações. Tente novamente." };
  }

  // Topbar reads full_name from each environment layout's own fetch — refresh it.
  revalidatePath("/", "layout");
  return { ok: true };
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function updateAvatar(_prevState: AvatarState | null, formData: FormData): Promise<AvatarState> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "Escolha uma imagem para enviar." };
  if (file.size > MAX_AVATAR_BYTES || !AVATAR_MIME_TYPES.has(file.type)) {
    return { error: "Use uma imagem JPG, PNG ou WebP de até 2 MB." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const input = Buffer.from(await file.arrayBuffer());
  let output: Buffer;
  try {
    const sharp = (await import("sharp")).default;
    const metadata = await sharp(input).metadata();
    if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
      return { error: "O arquivo não parece ser uma imagem válida." };
    }
    output = await sharp(input).resize(512, 512, { fit: "cover" }).webp({ quality: 85 }).toBuffer();
  } catch {
    return { error: "Não foi possível processar essa imagem. Tente outra." };
  }

  const { data: current } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).single();
  const path = `${user.id}/${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, output, {
    contentType: "image/webp",
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) return { error: "Não foi possível enviar a foto. Tente novamente." };

  const { error: profileError } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
  if (profileError) {
    await supabase.storage.from("avatars").remove([path]);
    return { error: "Não foi possível salvar a foto. Tente novamente." };
  }
  if (current?.avatar_path) await supabase.storage.from("avatars").remove([current.avatar_path]);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeAvatar(): Promise<AvatarState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: current } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).single();
  const { error } = await supabase.from("profiles").update({ avatar_path: null }).eq("id", user.id);
  if (error) return { error: "Não foi possível remover a foto. Tente novamente." };
  if (current?.avatar_path) await supabase.storage.from("avatars").remove([current.avatar_path]);
  revalidatePath("/", "layout");
  return { ok: true };
}

export interface ChangePasswordState {
  error?: string;
  ok?: boolean;
}

/**
 * Troca de senha estando logado (sem passar pelo fluxo de recuperação por
 * e-mail). Reautentica com a senha atual via signInWithPassword antes de
 * chamar updateUser — sem isso, qualquer sessão logada poderia trocar a
 * senha sem confirmar a atual, o que é pior segurança que o fluxo de
 * recuperação que este formulário substitui. Retorna estado em vez de
 * lançar, mesmo motivo de updateProfile ([[nextjs-server-action-error-redaction]]).
 */
export async function changePassword(_prevState: ChangePasswordState | null, formData: FormData): Promise<ChangePasswordState> {
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!currentPassword || !newPassword) return { error: "Preencha a senha atual e a nova senha." };
  if (newPassword.length < 8) return { error: "A nova senha precisa ter pelo menos 8 caracteres." };
  if (newPassword !== confirmPassword) return { error: "A confirmação precisa ser igual à nova senha." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) return { error: "Senha atual incorreta." };

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) return { error: "Não conseguimos trocar sua senha. Tente novamente." };

  return { ok: true };
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

  const { data: profile } = await admin.from("profiles").select("tenant_id, avatar_path").eq("id", user.id).single();

  if (profile?.avatar_path) {
    await admin.storage.from("avatars").remove([profile.avatar_path]);
  }

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteUserError) {
    redirect(`${returnPath}?deleteError=${encodeURIComponent("Não conseguimos excluir sua conta agora. Tente novamente.")}`);
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
  redirect("/login?message=" + encodeURIComponent("Sua conta foi excluída com sucesso."));
}
