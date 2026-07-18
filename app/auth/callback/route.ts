import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * OAuth / email-link callback. Supabase redirects here with a `code` (PKCE)
 * after the user clicks a recovery link or completes an OAuth flow. Exchange
 * it for a session (sets cookies) and forward to `next` — middleware takes it
 * from there (consent gate, then onboarding vs. straight into the app shell).
 *
 * `flow` distinguishes which caller built this URL (GoogleSignInButton vs.
 * requestPasswordReset/updatePassword) so a failed exchange redirects
 * somewhere that makes sense for that flow, instead of always assuming
 * password recovery — string-sniffing on `next`'s value would be fragile
 * (breaks silently if a route is renamed), so callers set this explicitly.
 * Defaults to "recovery" to preserve behavior for any pre-existing/cached
 * reset links that predate this param.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const flow = url.searchParams.get("flow") ?? "recovery";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(safeNext, url.origin));
    }
  }

  if (flow === "oauth") {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent("Não foi possível entrar com o Google. Tente novamente.")}`,
        url.origin,
      ),
    );
  }

  return NextResponse.redirect(
    new URL(
      `/recuperar-senha?error=${encodeURIComponent("Link inválido ou expirado. Solicite um novo.")}`,
      url.origin,
    ),
  );
}
