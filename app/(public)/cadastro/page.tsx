import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { SignupConsent } from "@/components/auth/SignupConsent";
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

        <SignupConsent redirectTo="/onboarding" />
        <div className="auth-divider"><span>ou</span></div>

        <form id="signup-form" className="auth-form" action={signup}>
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
