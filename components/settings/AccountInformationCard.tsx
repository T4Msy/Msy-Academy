import { ShieldCheck } from "lucide-react";

export function AccountInformationCard({ email, isProfessor }: { email: string; isProfessor: boolean }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
      <div className="border-b border-border px-5.5 py-5">
        <h2 className="font-display text-lg font-bold tracking-[-0.2px] text-foreground">Conta</h2>
        <p className="mt-1 text-sm text-muted-foreground">Dados de acesso e informações privadas da sua conta.</p>
      </div>
      <div className="flex flex-col gap-4.5 p-5.5">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground" htmlFor="account-email">
          E-mail
          <input id="account-email" value={email} disabled className="w-full rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 font-normal text-foreground opacity-70" />
          <span className="text-xs font-normal text-muted-foreground">Usado para entrar na sua conta.</span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground" htmlFor="account-role">
          Função da conta
          <input id="account-role" value={isProfessor ? "Professor" : "Aluno"} disabled className="w-full rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 font-normal text-foreground opacity-70" />
        </label>
        <p className="flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-brand-text" aria-hidden /> Essas informações não são exibidas para outros usuários.</p>
      </div>
    </section>
  );
}
