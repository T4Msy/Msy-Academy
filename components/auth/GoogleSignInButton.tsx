"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * RF-G01 — OAuth Google. Requires the Google provider to be enabled in the
 * Supabase Auth dashboard (client id/secret) — not something this app can
 * self-provision, so the provider isn't configured yet. Rather than let
 * users discover that only after clicking (a Supabase error mid-flow reads
 * as "this is broken"), the button is shown disabled with the real status
 * up front. Flip this to `true` once the Google provider is turned on in
 * the Supabase dashboard.
 */
const GOOGLE_OAUTH_ENABLED = false;

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12s3.36-7.27 7.19-7.27c3.08 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.19 2C6.42 2 2.03 6.8 2.03 12s4.39 10 10.16 10c5.05 0 9.81-3.64 9.81-10 0-.7-.09-1.28-.65-1.9Z"
      />
    </svg>
  );
}

export function GoogleSignInButton({ redirectTo = "/", disabled = false }: { redirectTo?: string; disabled?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!GOOGLE_OAUTH_ENABLED) {
    return (
      <div>
        <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-4 py-2.5 w-full" disabled title="Em breve">
          <GoogleIcon />
          Continuar com Google
          <span className="chip ml-sm">Em breve</span>
        </button>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">Login com Google ainda não está disponível — use e-mail e senha por enquanto.</p>
      </div>
    );
  }

  async function signInWithGoogle() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) {
      setError("Login com Google indisponível no momento. Use e-mail e senha.");
      setPending(false);
    }
    // On success, Supabase redirects the browser away — no further state to set.
  }

  return (
    <div>
      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-4 py-2.5 w-full"
        onClick={signInWithGoogle}
        disabled={pending || disabled}
      >
        <GoogleIcon />
        {pending ? "Redirecionando…" : "Continuar com Google"}
      </button>
      {error && <p className="mt-1 text-xs leading-snug text-muted-foreground text-danger-text">{error}</p>}
    </div>
  );
}
