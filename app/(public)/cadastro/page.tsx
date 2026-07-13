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
    <div className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-[420px] rounded-lg border border-border bg-card p-7 pt-8 shadow-elevated">
        <div className="mb-5.5 flex items-center gap-[11px]">
          <Logo />
          <div>
            <div className="font-display text-2xl font-extrabold tracking-[-0.4px] text-foreground">Criar conta</div>
            <div className="mt-1 text-[13.5px] text-muted-foreground">Comece grátis — leva menos de um minuto</div>
          </div>
        </div>

        {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}

        <SignupConsent redirectTo="/onboarding" />
        <div className="my-4 flex items-center gap-3 text-xs text-subtle"><span>ou</span></div>

        <form id="signup-form" className="mt-2 flex flex-col gap-3.5" action={signup}>
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-semibold text-foreground" htmlFor="full_name">
              Nome completo
            </label>
            <input
              className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              placeholder="Ex: Maria Silva"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-semibold text-foreground" htmlFor="email">
              E-mail
            </label>
            <input
              className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="voce@escola.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-semibold text-foreground" htmlFor="password">
              Senha
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

          <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-4 py-2.5 w-full">
            Criar conta
          </button>
        </form>

        <p className="mt-1 text-center text-xs leading-snug text-muted-foreground">
          Depois de criar a conta, você escolhe se vai usar como professor, aluno, ou os dois.
        </p>

        <p className="mt-4.5 text-center text-sm text-muted-foreground">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
