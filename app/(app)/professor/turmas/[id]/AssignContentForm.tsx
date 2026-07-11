"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignContent } from "../actions";

type ContentOption = { id: string; title: string };

export function AssignContentForm({
  classId,
  exams,
  activities,
}: {
  classId: string;
  exams: ContentOption[];
  activities: ContentOption[];
}) {
  const [open, setOpen] = useState(false);
  const [contentType, setContentType] = useState<"EXAM" | "ACTIVITY">("EXAM");
  const [contentId, setContentId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const options = contentType === "EXAM" ? exams : activities;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contentId) {
      setError("Escolha o que atribuir.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await assignContent(classId, contentType, contentId, dueAt ? new Date(dueAt).toISOString() : null);
        setOpen(false);
        setContentId("");
        setDueAt("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)} disabled={exams.length === 0 && activities.length === 0}>
        Atribuir conteúdo
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="popover-form" style={{ maxWidth: 420 }}>
      <div className="form-grid-2">
        <div className="form-field">
          <label className="field-label" htmlFor="content-type">Tipo</label>
          <select
            className="input"
            id="content-type"
            value={contentType}
            onChange={(e) => {
              setContentType(e.target.value as "EXAM" | "ACTIVITY");
              setContentId("");
            }}
          >
            <option value="EXAM">Prova</option>
            <option value="ACTIVITY">Atividade</option>
          </select>
        </div>
        <div className="form-field">
          <label className="field-label" htmlFor="content-id">Qual</label>
          <select className="input" id="content-id" value={contentId} onChange={(e) => setContentId(e.target.value)}>
            <option value="">Selecione…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.title}</option>
            ))}
          </select>
        </div>
        <div className="form-field form-field--full">
          <label className="field-label" htmlFor="due-at">Prazo (opcional)</label>
          <input className="input" id="due-at" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </div>
      </div>

      {error && <div className="notice notice--error">{error}</div>}

      <div className="popover-row">
        <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => setOpen(false)}>Cancelar</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Atribuindo…" : "Atribuir"}
        </button>
      </div>
    </form>
  );
}
