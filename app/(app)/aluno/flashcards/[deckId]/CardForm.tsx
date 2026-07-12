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
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <div className="form-grid-2">
        <div className="form-field">
          <label className="field-label" htmlFor="card-front">Frente</label>
          <textarea className="input" id="card-front" value={front} onChange={(e) => setFront(e.target.value)} />
        </div>
        <div className="form-field">
          <label className="field-label" htmlFor="card-back">Verso</label>
          <textarea className="input" id="card-back" value={back} onChange={(e) => setBack(e.target.value)} />
        </div>
      </div>
      {error && <div className="notice notice--error">{error}</div>}
      <div className="popover-row">
        {onCancel && (
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
