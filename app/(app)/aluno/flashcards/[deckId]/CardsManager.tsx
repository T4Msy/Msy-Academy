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
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  if (editing) {
    return (
      <section className="card">
        <div className="card-body">
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
    <section className="card">
      <div className="card-body">
        <p className="question-statement question-statement--tight"><b>Frente:</b> {card.front}</p>
        <p className="question-statement question-statement--tight"><b>Verso:</b> {card.back}</p>
        {error && <div className="notice notice--error">{error}</div>}
        <div className="popover-row popover-row--start">
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => setEditing(true)}>
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
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
        + Adicionar cartão
      </button>
    );
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Novo cartão</h2>
      </div>
      <div className="card-body">
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
    <div className="questions-stack">
      {cards.length === 0 ? (
        <EmptyState variant="questoes" title="Sem cartões" text="Adicione o primeiro cartão manualmente." />
      ) : (
        cards.map((c) => <CardRow key={c.id} deckId={deckId} card={c} />)
      )}
      <AddCardPanel deckId={deckId} />
    </div>
  );
}
