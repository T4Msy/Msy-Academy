"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { requestBulkCorrection } from "./bulkCorrection";
import { selectVisibleSubmissions, toggleSubmissionSelection } from "./selection";

export interface CorrectionQueueItem {
  id: string;
  studentName: string;
  assignmentTitle: string;
  eligible: boolean;
}

export function CorrectionQueue({ items }: { items: CorrectionQueueItem[] }) {
  const eligible = items.filter((item) => item.eligible);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const selectAllRef = useRef<HTMLInputElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const allSelected = eligible.length > 0 && eligible.every((item) => selected.has(item.id));
  const partiallySelected = selected.size > 0 && !allSelected;
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = partiallySelected;
  }, [partiallySelected]);

  useEffect(() => {
    if (!confirmOpen) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    confirmButtonRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setConfirmOpen(false);
      if (event.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled])');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [confirmOpen]);

  function closeConfirmation() {
    setConfirmOpen(false);
    window.setTimeout(() => (previousFocus.current ?? triggerRef.current)?.focus(), 0);
  }

  function toggleAll() {
    setError(null);
    setSelected((current) => selectVisibleSubmissions(current, eligible.map((item) => item.id), !allSelected));
  }

  function confirmBulkCorrection() {
    const ids = Array.from(selected);
    setError(null);
    startTransition(async () => {
      try {
        const result = await requestBulkCorrection(ids);
        if (result.failed.length > 0) {
          setSelected(new Set(result.failed.map((item) => item.submissionId)));
          setError(`${result.processedIds.length} enviada(s); ${result.failed.length} não puderam ser processadas. Tente novamente.`);
        } else {
          setSelected(new Set());
          setMessage(`${result.processedIds.length} entrega(s) enviada(s) para correção.`);
        }
        closeConfirmation();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível enviar as entregas. Tente novamente.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3.5">
      {eligible.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 shadow-elevated">
          <label className="flex min-h-11 items-center gap-2.5 text-sm font-semibold text-foreground">
            <input ref={selectAllRef} type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Selecionar todas as entregas visíveis" className="size-4.5 accent-brand" />
            Selecionar todas as entregas visíveis
          </label>
          {selected.size > 0 && <span className="text-sm text-muted-foreground">{selected.size} entrega(s) selecionada(s)</span>}
        </div>
      )}
      {message && <div role="status" className="rounded-md border border-brand-border bg-brand-dim px-4 py-3 text-sm text-brand-text">{message}</div>}
      {error && <div role="alert" className="rounded-md border border-danger-border bg-danger-dim px-4 py-3 text-sm text-danger-text">{error}</div>}
      {items.map((item) => (
        <div key={item.id} className={`flex items-center gap-3 overflow-hidden rounded-lg border border-border bg-card p-5.5 shadow-elevated ${selected.has(item.id) ? "border-brand-border bg-brand-dim" : ""}`}>
          <input type="checkbox" checked={selected.has(item.id)} disabled={!item.eligible || pending} onChange={() => setSelected((current) => toggleSubmissionSelection(current, item.id))} aria-label={`Selecionar entrega de ${item.studentName}`} className="size-4.5 shrink-0 accent-brand" />
          <Link href={`/professor/correcao/${item.id}`} className="min-w-0 flex-1 rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow">
            <div className="font-display text-base font-bold text-foreground">{item.studentName}</div>
            <div className="mt-1 text-xs text-muted-foreground">{item.assignmentTitle}</div>
          </Link>
          <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">Pendente</span>
        </div>
      ))}
      {selected.size > 0 && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-border bg-card p-4 shadow-[0_8px_26px_rgba(0,0,0,0.28)]">
          <span className="text-sm font-semibold text-foreground">{selected.size} entrega(s) selecionada(s)</span>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setSelected(new Set())} disabled={pending} className="min-h-11 rounded-sm border border-border px-3 py-2 text-sm font-semibold text-foreground">Limpar seleção</button>
            <button ref={triggerRef} type="button" onClick={() => setConfirmOpen(true)} disabled={pending} className="min-h-11 rounded-sm bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">{pending ? "Enviando…" : "Corrigir selecionadas"}</button>
          </div>
        </div>
      )}
      {confirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeConfirmation(); }}>
          <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="bulk-correction-title" className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-2xl">
            <h2 id="bulk-correction-title" className="font-display text-xl font-bold text-foreground">Corrigir entregas selecionadas?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Você está prestes a iniciar a correção de {selected.size} entrega(s). Essa ação pode consumir cota de IA e levar alguns instantes.</p>
            <ul className="my-4 max-h-32 overflow-auto text-sm text-foreground">{Array.from(selected).slice(0, 5).map((id) => { const item = items.find((entry) => entry.id === id); return <li key={id}>{item?.studentName ?? id} — {item?.assignmentTitle ?? "Tarefa"}</li>; })}{selected.size > 5 && <li className="text-muted-foreground">+{selected.size - 5} outras</li>}</ul>
            <div className="flex justify-end gap-2"><button type="button" onClick={closeConfirmation} disabled={pending} className="min-h-11 rounded-sm border border-border px-3 py-2 text-sm font-semibold text-foreground">Cancelar</button><button ref={confirmButtonRef} type="button" onClick={confirmBulkCorrection} disabled={pending} className="min-h-11 rounded-sm bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">{pending ? "Enviando…" : "Confirmar correção"}</button></div>
          </section>
        </div>
      )}
    </div>
  );
}
