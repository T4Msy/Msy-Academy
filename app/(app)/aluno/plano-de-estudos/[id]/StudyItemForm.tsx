"use client";

import { useState, useTransition } from "react";

const TYPE_LABEL: Record<string, string> = { REVISAO: "Revisão", EXERCICIO: "Exercício", LEITURA: "Leitura" };

export interface StudyItemInput {
  item_date: string;
  topic: string;
  item_type: "REVISAO" | "EXERCICIO" | "LEITURA";
}

export function StudyItemForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Adicionar",
}: {
  initial?: StudyItemInput;
  onSubmit: (input: StudyItemInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [itemDate, setItemDate] = useState(initial?.item_date ?? "");
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [itemType, setItemType] = useState<StudyItemInput["item_type"]>(initial?.item_type ?? "REVISAO");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!itemDate || !topic.trim()) {
      setError("Preencha a data e o tópico.");
      return;
    }
    startTransition(async () => {
      try {
        await onSubmit({ item_date: itemDate, topic: topic.trim(), item_type: itemType });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <div className="form-grid-2">
        <div className="form-field">
          <label className="field-label" htmlFor="item-date">Data</label>
          <input className="input" id="item-date" type="date" value={itemDate} onChange={(e) => setItemDate(e.target.value)} />
        </div>
        <div className="form-field">
          <label className="field-label" htmlFor="item-type">Tipo</label>
          <select className="input" id="item-type" value={itemType} onChange={(e) => setItemType(e.target.value as StudyItemInput["item_type"])}>
            {(Object.keys(TYPE_LABEL) as StudyItemInput["item_type"][]).map((t) => (
              <option key={t} value={t}>{TYPE_LABEL[t]}</option>
            ))}
          </select>
        </div>
        <div className="form-field form-field--full">
          <label className="field-label" htmlFor="item-topic">Tópico</label>
          <input className="input" id="item-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex: Revisar funções trigonométricas" />
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
