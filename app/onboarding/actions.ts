"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { homeForRoles, safePostAuthRedirect } from "@/lib/auth/access";

type Role = "PROFESSOR" | "ALUNO";

export interface OnboardingState {
  error?: string;
  guardianConsentUrl?: string;
}

/**
 * Completes onboarding by inserting the chosen role(s) into user_roles.
 * RLS (`user_roles_insert_own`, migration 0004) restricts this to
 * PROFESSOR/ALUNO for the caller's own user_id — a client can never
 * self-grant ADMIN this way, even if it tried to call this action directly.
 *
 * `(prevState, formData)` signature — driven by `useActionState`, not
 * called imperatively — specifically so the terminal `redirect()` call is
 * never at risk of landing inside a client-side try/catch. `redirect()`
 * throws internally; a plain `await completeOnboarding(...)` wrapped in
 * `try/catch` on the client would catch that throw as a regular error
 * instead of letting Next.js turn it into navigation (same class of bug
 * fixed for `deleteMyAccount`, see lib/settings/actions.ts). Errors are
 * returned as state, not thrown, for the same reason `deleteMyAccount`
 * moved away from throw: a thrown Server Action error is redacted to a
 * generic message in `next build`/`next start` — see
 * [[nextjs-server-action-error-redaction]].
 */
async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function calculateAge(birthDate: string): number {
  const dob = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hadBirthdayThisYear =
    now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}

/**
 * When the student declares a birth date under 18, provisions a
 * `guardian_consents` row (RNF-C02, LGPD Art. 14) and returns a shareable
 * confirmation link instead of redirecting straight into the app — same
 * "share this link/code" pattern as class invites (migration 0007), chosen
 * specifically because there's no transactional email provider wired into
 * this app. The guardian visits the link with no account of their own; see
 * app/consentimento/[token] for the confirmation side.
 */
export async function completeOnboarding(
  _prevState: OnboardingState | null,
  formData: FormData,
): Promise<OnboardingState> {
  const roles = formData.getAll("roles") as Role[];
  const birthDate = (formData.get("birthDate") as string | null) || null;
  const redirectTo = (formData.get("redirectTo") as string | null) || null;

  if (roles.length === 0) {
    return { error: "Escolha ao menos um papel para continuar." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("user_roles")
    .insert(roles.map((role) => ({ user_id: user.id, role })));

  if (error) return { error: "Não conseguimos salvar sua escolha. Tente novamente." };

  let guardianConsentUrl: string | undefined;

  if (roles.includes("ALUNO") && birthDate && calculateAge(birthDate) < 18) {
    const { data: profile } = await supabase
      .from("profiles")
      .update({ birth_date: birthDate })
      .eq("id", user.id)
      .select("tenant_id")
      .single();

    if (profile) {
      const admin = createAdminClient();
      const { data: consent } = await admin
        .from("guardian_consents")
        .insert({ tenant_id: profile.tenant_id, student_id: user.id })
        .select("token")
        .single();

      if (consent) {
        guardianConsentUrl = `${await origin()}/consentimento/${consent.token}`;
      }
    }
  }

  revalidatePath("/", "layout");

  if (guardianConsentUrl) {
    return { guardianConsentUrl };
  }

  // Honor a pending destination (e.g. a class invite link) instead of the
  // default shell, so a brand-new user who clicked "/entrar/CODE" actually
  // lands back there after choosing a role.
  redirect(safePostAuthRedirect(redirectTo) ?? homeForRoles(roles) ?? "/acesso-indisponivel");
}
