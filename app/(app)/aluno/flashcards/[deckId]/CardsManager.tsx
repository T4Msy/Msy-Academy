"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCard, updateCard, deleteCard } from "../actions";
import { CardForm } from "./CardForm";
import { EmptyState } from "@/components/EmptyState";
import { InlineDeleteConfirm } from "@/components/InlineDeleteConfirm";

interface CardData {
  id: string;
  front: string;
  back: string;
}

function CardRow({ deckId, card }: { deckId: string; card: CardData }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function onDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteCard(deckId, card.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não conseguimos excluir o cartão. Tente novamente.");
      }
    });
  }

  if (editing) {
    return (
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
        <div className="flex flex-col gap-4.5 p-5.5">
          <CardForm
            initialFront={card.front}
            initialBack={card.back}
            submitLabel="Salvar"
            onCancel={() => setEditing(false)}
            onSubmit={async (front, back) => {
              await updateCard(deckId, card.id, front, back);
              setEditing(false);
              router.refresh();
            }}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
      <div className="flex flex-col gap-4.5 p-5.5">
        <p className="mb-2 text-[14.5px] leading-relaxed text-foreground"><b>Frente:</b> {card.front}</p>
        <p className="mb-2 text-[14.5px] leading-relaxed text-foreground"><b>Verso:</b> {card.back}</p>
        {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}
        <div className="flex flex-wrap justify-start gap-2">
          <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" disabled={pending} onClick={() => setEditing(true)}>
            Editar
          </button>
          <InlineDeleteConfirm
            confirming={confirming}
            pending={pending}
            onRequestConfirm={() => setConfirming(true)}
            onCancel={() => setConfirming(false)}
            onConfirm={onDelete}
            hint="Excluir este cartão?"
          />
        </div>
      </div>
    </section>
  );
}

function AddCardPanel({ deckId }: { deckId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!open) {
    return (
      <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-4 py-2.5" onClick={() => setOpen(true)}>
        + Adicionar cartão
      </button>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
        <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Novo cartão</h2>
      </div>
      <div className="flex flex-col gap-4.5 p-5.5">
        <CardForm
          submitLabel="Adicionar"
          onCancel={() => setOpen(false)}
          onSubmit={async (front, back) => {
            await createCard(deckId, front, back);
            setOpen(false);
            router.refresh();
          }}
        />
      </div>
    </section>
  );
}

export function CardsManager({ deckId, cards }: { deckId: string; cards: CardData[] }) {
  return (
    <div className="flex flex-col gap-3.5">
      {cards.length === 0 ? (
        <EmptyState variant="questoes" title="Sem cartões" text="Adicione o primeiro cartão manualmente." />
      ) : (
        cards.map((c) => <CardRow key={c.id} deckId={deckId} card={c} />)
      )}
      <AddCardPanel deckId={deckId} />
    </div>
  );
}
