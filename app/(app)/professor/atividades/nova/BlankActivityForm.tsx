"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBlankActivity } from "../actions";

export function BlankActivityForm() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!titulo.trim()) {
      setError("Informe um título para a atividade.");
      return;
    }
    startTransition(async () => {
      try {
        const id = await createBlankActivity(titulo);
        router.push(`/professor/atividades/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <form className="flex flex-col gap-3.5" onSubmit={handleSubmit} noValidate>
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
        <div className="flex flex-col gap-4.5 p-5.5">
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-semibold text-foreground" htmlFor="blank-atividade-titulo">Título</label>
            <input
              className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
              id="blank-atividade-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Lista de exercícios — Frações"
            />
          </div>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">Você adiciona as questões manualmente na tela seguinte.</p>
          {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3.5">
            <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-4 py-2.5" disabled={pending}>
              {pending ? "Criando…" : "Criar atividade"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
