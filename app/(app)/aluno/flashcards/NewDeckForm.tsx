"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDeck } from "./actions";

export function NewDeckForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Informe um título para o deck.");
      return;
    }
    startTransition(async () => {
      try {
        const id = await createDeck(title);
        router.push(`/aluno/flashcards/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit} noValidate>
      <section className="card">
        <div className="card-body">
          <div className="form-field">
            <label className="field-label" htmlFor="deck-title">Título do deck</label>
            <input className="input" id="deck-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Vocabulário — Capítulo 3" />
          </div>
          <p className="field-hint">Você adiciona os cartões manualmente na tela seguinte.</p>
          {error && <div className="notice notice--error">{error}</div>}
          <div className="submit-row" style={{ marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Criando…" : "Criar deck"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
