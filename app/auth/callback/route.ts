import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * OAuth / email-link callback. Supabase redirects here with a `code` (PKCE)
 * after the user clicks a recovery link or completes an OAuth flow. Exchange
 * it for a session (sets cookies) and forward to `next` — middleware takes it
 * from there (onboarding vs. straight into the app shell).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(safeNext, url.origin));
    }
  }

  return NextResponse.redirect(
    new URL(
      `/recuperar-senha?error=${encodeURIComponent("Link inválido ou expirado. Solicite um novo.")}`,
      url.origin,
    ),
  );
}
