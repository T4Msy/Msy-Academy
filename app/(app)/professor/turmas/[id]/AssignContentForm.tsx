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
        setError(err instanceof Error ? err.message : "Não conseguimos enviar este conteúdo para a turma. Tente novamente.");
      }
    });
  }

  if (!open) {
    return (
      <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-3 py-[7px] text-sm" onClick={() => setOpen(true)} disabled={exams.length === 0 && activities.length === 0}>
        Atribuir conteúdo
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-[420px] flex-col gap-2.5 p-1">
      <div className="grid grid-cols-1 gap-3.5 min-[861px]:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="block text-sm font-semibold text-foreground" htmlFor="content-type">Tipo</label>
          <select
            className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
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
        <div className="flex flex-col gap-1.5">
          <label className="block text-sm font-semibold text-foreground" htmlFor="content-id">Qual</label>
          <select className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="content-id" value={contentId} onChange={(e) => setContentId(e.target.value)}>
            <option value="">Selecione…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.title}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="block text-sm font-semibold text-foreground" htmlFor="due-at">Prazo (opcional)</label>
          <input className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="due-at" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </div>
      </div>

      {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" disabled={pending} onClick={() => setOpen(false)}>Cancelar</button>
        <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-3 py-[7px] text-sm" disabled={pending}>
          {pending ? "Atribuindo…" : "Atribuir"}
        </button>
      </div>
    </form>
  );
}
