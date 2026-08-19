"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createAnnouncement } from "@/app/(app)/professor/turmas/actions";

/** Publica avisos usando o contexto da turma atual. */
export function NewAnnouncementDialog({ classId, className, showAllLink = true, firstNotice = false }: { classId: string; className: string; showAllLink?: boolean; firstNotice?: boolean }) {
  const [open, setOpen] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  function publish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = new FormData(form).get("message");
    setError(null);
    startTransition(async () => {
      try {
        await createAnnouncement(classId, String(message ?? ""));
        form.reset();
        setPublished(true);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível publicar o aviso.");
      }
    });
  }
  return <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) { setPublished(false); setError(null); } }}>
    <div className={firstNotice ? "" : "flex flex-wrap justify-end gap-2"}>
      {showAllLink && <Button variant="link" size="sm" asChild><a href="/professor/avisos">Todos os avisos</a></Button>}
      <DialogTrigger asChild><Button type="button" size={firstNotice ? "default" : "sm"}>{!firstNotice && <Plus aria-hidden />}{firstNotice ? "Publicar primeiro aviso" : "Novo aviso"}</Button></DialogTrigger>
    </div>
    {published && <p role="status" className="mt-2 text-sm font-semibold text-brand-text">Aviso publicado.</p>}
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
      <DialogHeader><DialogTitle>Novo aviso</DialogTitle><DialogDescription>Publique um comunicado para os alunos desta turma.</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={publish}>
        <div className="rounded-md border border-border bg-card-2 px-3 py-2.5"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Turma</p><p className="mt-1 text-sm font-semibold text-foreground">{className}</p></div>
        <label className="block text-sm font-semibold text-foreground" htmlFor="announcement-message">Mensagem<Textarea id="announcement-message" name="message" required maxLength={2000} className="mt-1.5 min-h-32 bg-card font-normal" placeholder="Escreva um aviso para esta turma" /></label>
        {error && <p role="alert" className="rounded-md border border-danger-border bg-danger-dim px-3 py-2 text-sm text-danger-text">{error}</p>}
        <DialogFooter><DialogClose asChild><Button type="button" variant="outline" disabled={pending}>Cancelar</Button></DialogClose><Button type="submit" disabled={pending}>{pending ? "Publicando…" : "Publicar aviso"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
