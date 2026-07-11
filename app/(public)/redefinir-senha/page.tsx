import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { updatePassword } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Nova senha" };

export default async function ResetPage({
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
            <div className="auth-title">Nova senha</div>
            <div className="auth-subtitle">Defina uma nova senha para sua conta</div>
          </div>
        </div>

        {error && <div className="notice notice--error">{error}</div>}

        <form className="auth-form" action={updatePassword}>
          <div className="form-field">
            <label className="field-label" htmlFor="password">
              Nova senha
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
          <div className="form-field">
            <label className="field-label" htmlFor="confirm">
              Confirmar nova senha
            </label>
            <input
              className="input"
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="Repita a senha"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Salvar nova senha
          </button>
        </form>

        <p className="auth-foot">
          <Link href="/login">Voltar para o login</Link>
        </p>
      </div>
    </div>
  );
}
