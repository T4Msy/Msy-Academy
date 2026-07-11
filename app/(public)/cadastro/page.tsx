import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { signup } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Criar conta" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <Logo />
          <div>
            <div className="auth-title">Criar conta</div>
            <div className="auth-subtitle">Comece grátis — leva menos de um minuto</div>
          </div>
        </div>

        {error && <div className="notice notice--error">{error}</div>}

        <GoogleSignInButton redirectTo="/onboarding" />
        <p className="field-hint" style={{ textAlign: "center", marginTop: 8 }}>
          Ao continuar com o Google, você concorda com os{" "}
          <Link href="/termos">Termos de Uso</Link> e a{" "}
          <Link href="/privacidade">Política de Privacidade</Link>.
        </p>
        <div className="auth-divider"><span>ou</span></div>

        <form className="auth-form" action={signup}>
          <div className="form-field">
            <label className="field-label" htmlFor="full_name">
              Nome completo
            </label>
            <input
              className="input"
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              placeholder="Ex: Maria Silva"
            />
          </div>
          <div className="form-field">
            <label className="field-label" htmlFor="email">
              E-mail
            </label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="voce@escola.com"
            />
          </div>
          <div className="form-field">
            <label className="field-label" htmlFor="password">
              Senha
            </label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <label className="opt-check" htmlFor="consent" style={{ marginBottom: 14 }}>
            <input type="checkbox" id="consent" name="consent" required />
            <span className="opt-box" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="opt-text">
              <span>
                Li e concordo com os <Link href="/termos">Termos de Uso</Link> e a{" "}
                <Link href="/privacidade">Política de Privacidade</Link>, e confirmo que tenho 18
                anos ou autorização de um responsável legal.
              </span>
            </span>
          </label>

          <button type="submit" className="btn btn-primary btn-block">
            Criar conta
          </button>
        </form>

        <p className="auth-foot">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
