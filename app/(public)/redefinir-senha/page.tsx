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
    <div className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-[420px] rounded-lg border border-border bg-card p-7 pt-8 shadow-elevated">
        <div className="mb-5.5 flex items-center gap-[11px]">
          <Logo />
          <div>
            <div className="font-display text-2xl font-extrabold tracking-[-0.4px] text-foreground">Nova senha</div>
            <div className="mt-1 text-[13.5px] text-muted-foreground">Defina uma nova senha para sua conta</div>
          </div>
        </div>

        {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}

        <form className="mt-2 flex flex-col gap-3.5" action={updatePassword}>
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-semibold text-foreground" htmlFor="password">
              Nova senha
            </label>
            <input
              className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-semibold text-foreground" htmlFor="confirm">
              Confirmar nova senha
            </label>
            <input
              className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="Repita a senha"
            />
          </div>
          <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-4 py-2.5 w-full">
            Salvar nova senha
          </button>
        </form>

        <p className="mt-4.5 text-center text-sm text-muted-foreground">
          <Link href="/login">Voltar para o login</Link>
        </p>
      </div>
    </div>
  );
}
