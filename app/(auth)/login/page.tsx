import Link from "next/link";
import { Logo } from "@/components/Logo";
import { login } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; redirect?: string }>;
}) {
  const { error, message, redirect } = await searchParams;

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <Logo />
          <div>
            <div className="auth-title">MSY Academy</div>
            <div className="auth-subtitle">Entre na sua conta de professor</div>
          </div>
        </div>

        {message && <div className="notice">{message}</div>}
        {error && <div className="notice notice--error">{error}</div>}

        <form className="auth-form" action={login}>
          <input type="hidden" name="redirect" value={redirect ?? "/dashboard"} />
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
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Entrar
          </button>
        </form>

        <p className="auth-foot">
          Não tem conta? <Link href="/signup">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
