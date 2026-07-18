"use client";

import { useState, useTransition } from "react";
import { confirmGuardianConsent } from "./actions";

export function ConsentForm({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await confirmGuardianConsent(token, name);
        setDone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não conseguimos registrar sua resposta. Tente novamente.");
      }
    });
  }

  if (done) {
    return (
      <div className="text-center mt-md">
        <div aria-hidden="true" className="status-icon status-icon--sm">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="mt-0 text-xs leading-snug text-muted-foreground">
          Consentimento confirmado. Obrigado — o estudante já pode continuar usando a plataforma.
        </p>
      </div>
    );
  }

  return (
    <form className="mt-2 flex flex-col gap-3.5" onSubmit={onSubmit}>
      <div className="flex flex-col gap-1.5">
        <label className="block text-sm font-semibold text-foreground" htmlFor="guardian_name">
          Seu nome (responsável legal)
        </label>
        <input
          className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
          id="guardian_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome completo"
          autoComplete="name"
          required
        />
      </div>
      {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}
      <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-4 py-2.5 w-full" disabled={pending}>
        {pending ? "Confirmando…" : "Confirmar consentimento"}
      </button>
    </form>
  );
}
