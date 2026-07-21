"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignContent } from "../../turmas/actions";

type ClassOption = { id: string; name: string; assignmentId?: string };

export function SendExamToClass({ examId, examTitle, questionCount, classes }: { examId: string; examTitle: string; questionCount: number; classes: ClassOption[] }) {
  const [open, setOpen] = useState(false);
  const [classId, setClassId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const selectedClass = classes.find((item) => item.id === classId);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!classId) return setError("Escolha uma turma.");
    if (selectedClass?.assignmentId) return setError("Esta prova já está enviada para a turma selecionada.");
    if (dueAt && new Date(dueAt).getTime() <= Date.now()) return setError("O prazo precisa estar no futuro.");
    setError(null);
    startTransition(async () => {
      try {
        await assignContent(classId, "EXAM", examId, dueAt ? new Date(dueAt).toISOString() : null);
        setOpen(false); setClassId(""); setDueAt(""); router.refresh();
      } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível enviar a prova para a turma."); }
    });
  }

  if (questionCount === 0 || classes.length === 0) return null;
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-3 py-[7px] text-sm font-bold text-primary-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow">Enviar para turma</button>;

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setOpen(false); }}>
    <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="send-exam-title" className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-2xl">
      <h2 id="send-exam-title" className="font-display text-xl font-bold text-foreground">Enviar para turma</h2>
      <p className="mt-2 text-sm text-muted-foreground">{examTitle} · {questionCount} questão(ões)</p>
      <div className="mt-5 flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground" htmlFor="send-class">Turma<select id="send-class" value={classId} onChange={(event) => { setClassId(event.target.value); setError(null); }} className="rounded-sm border border-border bg-card px-3 py-2.5 font-normal outline-none focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"><option value="">Selecione uma turma</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}{item.assignmentId ? " — já enviada" : ""}</option>)}</select></label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground" htmlFor="send-due">Prazo (opcional)<input id="send-due" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="rounded-sm border border-border bg-card px-3 py-2.5 font-normal outline-none focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" /></label>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">A prova original permanece intacta. A turma receberá uma atribuição vinculada a esta prova.</p>
      {error && <p role="alert" className="mt-3 rounded-md border border-danger-border bg-danger-dim px-3 py-2 text-sm text-danger-text">{error}</p>}
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} disabled={pending} className="min-h-11 rounded-sm border border-border px-3 py-2 text-sm font-semibold text-foreground">Cancelar</button><button type="submit" disabled={pending || Boolean(selectedClass?.assignmentId)} className="min-h-11 rounded-sm bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">{pending ? "Enviando…" : "Confirmar envio"}</button></div>
    </form>
  </div>;
}
