"use client";

import { useState, useTransition } from "react";

export function CardForm({
  initialFront = "",
  initialBack = "",
  onSubmit,
  onCancel,
  submitLabel = "Adicionar",
}: {
  initialFront?: string;
  initialBack?: string;
  onSubmit: (front: string, back: string) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!front.trim() || !back.trim()) {
      setError("Preencha a frente e o verso do cartão.");
      return;
    }
    startTransition(async () => {
      try {
        await onSubmit(front, back);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não conseguimos salvar o cartão. Tente novamente.");
      }
    });
  }

  return (
    <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-3.5 min-[861px]:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="block text-sm font-semibold text-foreground" htmlFor="card-front">Frente</label>
          <textarea className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="card-front" value={front} onChange={(e) => setFront(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="block text-sm font-semibold text-foreground" htmlFor="card-back">Verso</label>
          <textarea className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="card-back" value={back} onChange={(e) => setBack(e.target.value)} />
        </div>
      </div>
      {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" disabled={pending} onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-3 py-[7px] text-sm" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
