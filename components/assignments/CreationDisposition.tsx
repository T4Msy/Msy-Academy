"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function CreationDisposition({ kind, discard, sendTargetId = "send-content" }: { kind: "prova" | "atividade"; discard: () => Promise<void>; sendTargetId?: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [discardError, setDiscardError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const label = kind === "prova" ? "prova" : "atividade";
  const sendLabel = kind === "prova" ? "Enviar prova" : "Enviar atividade";

  function openAssignmentDialog() {
    const trigger = document.getElementById(sendTargetId);
    if (trigger instanceof HTMLButtonElement) trigger.click();
    else console.error(`[assignment/${kind}] botão de envio não encontrado`, { sendTargetId });
  }

  return <>
    <section className="mb-5 rounded-lg border border-brand-border bg-brand-dim px-4 py-3.5 sm:px-5" aria-labelledby="creation-disposition-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><h2 id="creation-disposition-title" className="font-display text-base font-bold text-foreground">{label[0].toUpperCase() + label.slice(1)} pronta para envio</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Envie para uma turma ou descarte este conteúdo. Ele só aparecerá na organização por turmas depois do envio.</p></div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center"><Button type="button" onClick={openAssignmentDialog}>{sendLabel}</Button><Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(true)}><Trash2 aria-hidden />Descartar</Button></div>
      </div>
    </section>
    <Dialog open={confirming} onOpenChange={(open) => { setConfirming(open); if (!open) setDiscardError(null); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Descartar esta {label}?</DialogTitle><DialogDescription>Esta ação removerá o conteúdo e ele não será enviado para nenhuma turma.</DialogDescription></DialogHeader>
        {discardError && <p role="alert" aria-live="assertive" className="rounded-md border border-danger-border bg-danger-dim px-3 py-2 text-sm text-danger-text">{discardError}</p>}
        <DialogFooter><DialogClose asChild><Button variant="outline" disabled={pending}>Continuar editando</Button></DialogClose><Button variant="destructive" disabled={pending} onClick={() => startTransition(async () => { try { await discard(); setConfirming(false); router.push(kind === "prova" ? "/professor/provas" : "/professor/atividades"); } catch (error) { if (process.env.NODE_ENV === "development") console.error(`[assignment/${kind}] falha ao descartar`, error); setDiscardError("Não foi possível descartar o conteúdo no momento."); } })}>{pending ? "Descartando…" : `Descartar ${label}`}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
