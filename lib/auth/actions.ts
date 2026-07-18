"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/http/client-ip";

/**
 * Auth server actions, shared by the public (login/cadastro) routes and the
 * authenticated shell (logout button in the Topbar). Lives in lib/, not
 * inside a route group, so it isn't coupled to whichever route renders the
 * form that calls it.
 */

function safeRedirect(target: string | null | undefined): string {
  if (target && target.startsWith("/") && !target.startsWith("//")) return target;
  return "/";
}

async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirect(formData.get("redirect") as string | null);
  const captchaToken = String(formData.get("captchaToken") ?? "").trim() || undefined;

  const rateLimit = await checkRateLimit("auth", getClientIp(await headers()));
  if (!rateLimit.success) {
    redirect(`/login?error=${encodeURIComponent("Muitas tentativas. Tente novamente em alguns minutos.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signup(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const consent = formData.get("consent") === "on";
  const captchaToken = String(formData.get("captchaToken") ?? "").trim() || undefined;

  if (!consent) {
    redirect(
      `/cadastro?error=${encodeURIComponent("É preciso aceitar os Termos de Uso e a Política de Privacidade.")}`,
    );
  }

  const rateLimit = await checkRateLimit("auth", getClientIp(await headers()));
  if (!rateLimit.success) {
    redirect(`/cadastro?error=${encodeURIComponent("Muitas tentativas. Tente novamente em alguns minutos.")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, captchaToken },
  });

  if (error) {
    redirect(`/cadastro?error=${encodeURIComponent(error.message)}`);
  }

  // If email confirmation is required, there is no active session yet — no
  // way to satisfy RLS to stamp consent now. The middleware consent gate
  // (lib/supabase/middleware.ts) covers this at the first real login.
  if (!data.session) {
    redirect(
      `/login?message=${encodeURIComponent(
        "Conta criada. Verifique seu e-mail para confirmar e então entre.",
      )}`,
    );
  }

  // Persist the consent this action already required above (RNF-C01) — a
  // session exists here, so RLS (profiles_update_own) allows the write.
  await supabase.from("profiles").update({ terms_accepted_at: new Date().toISOString() }).eq("id", data.user!.id);

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Send a password-reset email. The link routes through /auth/callback, which
 * exchanges the code for a session and lands the user on /redefinir-senha.
 * Always reports success — never leaks whether an email exists.
 */
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const captchaToken = String(formData.get("captchaToken") ?? "").trim() || undefined;

  if (email) {
    const rateLimit = await checkRateLimit("auth", getClientIp(await headers()));
    if (rateLimit.success) {
      const supabase = await createClient();
      const redirectTo = `${await origin()}/auth/callback?next=/redefinir-senha&flow=recovery`;
      await supabase.auth.resetPasswordForEmail(email, { redirectTo, captchaToken });
    }
    // Rate-limited requests fall through to the same generic message below —
    // never a distinct error, preserves the anti-enumeration property (an
    // attacker can't distinguish "rate limited" from "email doesn't exist"
    // from "email sent").
  }

  redirect(
    `/recuperar-senha?message=${encodeURIComponent(
      "Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha.",
    )}`,
  );
}

/** Set a new password. Requires the recovery session established by /auth/callback. */
export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 6) {
    redirect(
      `/redefinir-senha?error=${encodeURIComponent("A senha deve ter ao menos 6 caracteres.")}`,
    );
  }
  if (password !== confirm) {
    redirect(`/redefinir-senha?error=${encodeURIComponent("As senhas não coincidem.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/recuperar-senha?error=${encodeURIComponent(
        "Link inválido ou expirado. Solicite um novo.",
      )}`,
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/redefinir-senha?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect(
    `/login?message=${encodeURIComponent("Senha atualizada. Entre com a nova senha.")}`,
  );
}
