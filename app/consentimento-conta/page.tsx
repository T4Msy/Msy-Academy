import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { acceptTerms } from "./actions";
import { safePostAuthRedirect } from "@/lib/auth/access";

export const metadata: Metadata = { title: "Termos e privacidade" };

/**
 * Interstitial gate between login and the app for anyone whose
 * profiles.terms_accepted_at is null — reached via lib/supabase/middleware.ts's
 * redirect, primarily for Google sign-ins (RF-G01), which skip the /cadastro
 * form's consent checkbox entirely. Distinct from /consentimento/[token],
 * which is a guardian (no account of their own) approving a minor's account —
 * this route is the account owner accepting terms for themselves.
 */
export default async function ConsentimentoContaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}) {
  const { error, redirect: redirectTo } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="grid min-h-screen place-items-center px-5 py-10">
      <div className="auth-card">
        <div className="mb-5.5 flex items-center gap-[11px]">
          <Logo />
          <div>
            <div className="font-display text-2xl font-extrabold tracking-[-0.4px] text-foreground">
              Antes de continuar
            </div>
            <div className="mt-1 text-[13.5px] text-muted-foreground">MSY Academy — plataforma educacional</div>
          </div>
        </div>

        <p className="mt-0 text-xs leading-snug text-muted-foreground">
          Para usar a MSY Academy precisamos da sua confirmação de que leu e concorda com os nossos
          Termos de Uso e Política de Privacidade — inclusive com o uso de inteligência artificial
          para geração de provas, correção e tutoria.
        </p>

        {error && (
          <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">
            {error}
          </div>
        )}

        <form className="mt-3.5 flex flex-col gap-3.5" action={acceptTerms}>
          <input type="hidden" name="redirect" value={safePostAuthRedirect(redirectTo) ?? "/"} />
          <label className="opt-check" htmlFor="accept">
            <input type="checkbox" id="accept" name="accept" />
            <span className="opt-box" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="opt-text">
              <span>
                Li e concordo com os <a href="/termos">Termos de Uso</a> e a{" "}
                <a href="/privacidade">Política de Privacidade</a>, e confirmo que tenho 18 anos ou
                autorização de um responsável legal.
              </span>
            </span>
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-4 py-2.5 w-full"
          >
            Aceitar e continuar
          </button>
        </form>
      </div>
    </div>
  );
}
