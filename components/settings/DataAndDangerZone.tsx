import { DeleteAccountForm } from "./DeleteAccountForm";

/** "Meus dados" (export) + "Zona de perigo" (delete) sections shared by the professor and aluno Configurações pages. */
export function DataAndDangerZone({ returnPath, deleteError }: { returnPath: string; deleteError?: string }) {
  return (
    <>
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Meus dados</h2>
          </div>
        </div>
        <div className="flex flex-col gap-4.5 p-5.5">
          <p className="mt-0 text-xs leading-snug text-muted-foreground">
            Baixe uma cópia de tudo que você criou e de todo o seu histórico na plataforma.
          </p>
          <a href="/api/settings/export" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm">
            Exportar meus dados
          </a>
        </div>
      </section>
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors border-danger-border">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Zona de perigo</h2>
          </div>
        </div>
        <div className="flex flex-col gap-4.5 p-5.5">
          <DeleteAccountForm returnPath={returnPath} error={deleteError} />
        </div>
      </section>
    </>
  );
}
