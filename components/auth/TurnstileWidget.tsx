"use client";

import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

/**
 * CAPTCHA widget for login/cadastro/recuperar-senha (Supabase Auth verifies
 * the token server-side — no custom verification backend needed here, just
 * capturing it and passing it through supabase.auth.* calls' captchaToken
 * option). Returns null (no widget, no token) when
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set — same graceful-degradation
 * philosophy as AI_PROVIDER/Upstash elsewhere in this app.
 *
 * IMPORTANT deployment-order note (see docs/16-autenticacao.md): this is the
 * one integration where the env var and a Supabase Dashboard toggle
 * ("Enable CAPTCHA protection") must move in lockstep — ship this code and
 * confirm real logins still work BEFORE enabling enforcement on the
 * dashboard, or every login/signup gets rejected, including your own.
 *
 * Renders a plain hidden input carrying the token so it travels through the
 * surrounding <form action={...}> as regular FormData — same bridging
 * technique already used for the consent checkbox in SignupConsent.tsx.
 */
export function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [token, setToken] = useState("");

  if (!siteKey) return null;

  return (
    <div className="mt-1">
      <Turnstile siteKey={siteKey} onSuccess={setToken} options={{ theme: "auto" }} />
      <input type="hidden" name="captchaToken" value={token} />
    </div>
  );
}
