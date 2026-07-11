import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { requestPasswordReset } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Recuperar senha" };

export default async function RecoverPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <Logo />
          <div>
            <div className="auth-title">Recuperar senha</div>
            <div className="auth-subtitle">
              Enviaremos um link para você criar uma nova senha
            </div>
          </div>
        </div>

        {message && <div className="notice">{message}</div>}
        {error && <div className="notice notice--error">{error}</div>}

        <form className="auth-form" action={requestPasswordReset}>
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
          <button type="submit" className="btn btn-primary btn-block">
            Enviar link de recuperação
          </button>
        </form>

        <p className="auth-foot">
          Lembrou a senha? <Link href="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
