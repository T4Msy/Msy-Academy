"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeRedirect(target: string | null | undefined): string {
  if (target && target.startsWith("/") && !target.startsWith("//")) return target;
  return "/";
}

/**
 * Server-side backstop for LGPD consent (RNF-C01) — the counterpart to the
 * checkbox re-checked in lib/auth/actions.ts's signup() for the e-mail/senha
 * path. Users who authenticate via Google (or any future OAuth provider)
 * skip that form entirely, so this route + action is what actually gates
 * them: lib/supabase/middleware.ts redirects any authenticated user whose
 * profiles.terms_accepted_at is null here before letting them reach
 * onboarding or the app shell.
 */
export async function acceptTerms(formData: FormData) {
  const accept = formData.get("accept") === "on";
  const redirectTo = safeRedirect(formData.get("redirect") as string | null);

  if (!accept) {
    redirect(
      `/consentimento-conta?error=${encodeURIComponent("É preciso aceitar os Termos de Uso e a Política de Privacidade.")}&redirect=${encodeURIComponent(redirectTo)}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ terms_accepted_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) {
    redirect(
      `/consentimento-conta?error=${encodeURIComponent(`Não foi possível salvar: ${error.message}`)}&redirect=${encodeURIComponent(redirectTo)}`,
    );
  }

  redirect(redirectTo);
}
