"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitReview } from "../actions";
import type { SrsState } from "@/lib/srs/sm2";
import { EmptyState } from "@/components/EmptyState";

export interface ReviewCard {
  id: string;
  front: string;
  back: string;
  srs_state: SrsState;
}

const QUALITY_BUTTONS: { label: string; quality: 0 | 1 | 2 | 3 | 4 | 5; variant: "danger" | "ghost" | "primary" }[] = [
  { label: "Errei", quality: 1, variant: "danger" },
  { label: "Difícil", quality: 3, variant: "ghost" },
  { label: "Bom", quality: 4, variant: "ghost" },
  { label: "Fácil", quality: 5, variant: "primary" },
];

export function DeckReview({ deckId, dueCards }: { deckId: string; dueCards: ReviewCard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (dueCards.length === 0) {
    return <EmptyState variant="tarefa" title="Tudo em dia!" text="Nenhum cartão para revisar agora. Volte mais tarde." />;
  }

  if (index >= dueCards.length) {
    return <EmptyState variant="tarefa" title="Sessão concluída" text="Você revisou todos os cartões pendentes." />;
  }

  const card = dueCards[index];

  function onAnswer(quality: 0 | 1 | 2 | 3 | 4 | 5) {
    startTransition(async () => {
      await submitReview(deckId, card.id, card.srs_state, quality);
      setFlipped(false);
      setIndex((i) => i + 1);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="mt-0.5 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{index + 1} de {dueCards.length}</span>
      </div>
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
        <div className="flex flex-col p-5.5 min-h-[140px] items-center justify-center gap-4.5 text-center">
          <p className="mb-0 text-lg leading-relaxed text-foreground">
            {flipped ? card.back : card.front}
          </p>
        </div>
      </section>

      {!flipped ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3.5">
          <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 h-11.5 min-w-40 rounded-full px-5 font-display text-base tracking-[-0.2px]" onClick={() => setFlipped(true)}>
            Mostrar resposta
          </button>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3.5">
          {QUALITY_BUTTONS.map((b) => (
            <button
              key={b.label}
              type="button"
              className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 px-3 py-[7px] text-sm ${b.variant === "danger" ? "border border-danger-border bg-danger-dim text-danger-text hover:bg-danger/15" : b.variant === "primary" ? "bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90" : "border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)]"}`}
              disabled={pending}
              onClick={() => onAnswer(b.quality)}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
