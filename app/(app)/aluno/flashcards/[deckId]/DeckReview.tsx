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
    <div className="questions-stack">
      <div className="exam-meta">
        <span className="chip">{index + 1} de {dueCards.length}</span>
      </div>
      <section className="card question-card">
        <div className="card-body card-body--center">
          <p className="question-statement question-statement--flip">
            {flipped ? card.back : card.front}
          </p>
        </div>
      </section>

      {!flipped ? (
        <div className="submit-row">
          <button type="button" className="btn btn-primary btn-generate" onClick={() => setFlipped(true)}>
            Mostrar resposta
          </button>
        </div>
      ) : (
        <div className="submit-row">
          {QUALITY_BUTTONS.map((b) => (
            <button
              key={b.label}
              type="button"
              className={`btn btn-${b.variant === "danger" ? "danger-ghost" : b.variant === "primary" ? "primary" : "ghost"} btn-sm`}
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
