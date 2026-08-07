"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/** Keeps the class context visible while the database lacks announcement-title support. */
export function NewAnnouncementDialog({ className, showAllLink = true, firstNotice = false }: { className: string; showAllLink?: boolean; firstNotice?: boolean }) {
  const [open, setOpen] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  function publish(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setUnavailable(true); }
  return <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setUnavailable(false); }}>
    <div className={firstNotice ? "" : "flex flex-wrap justify-end gap-2"}>
      {showAllLink && <Button variant="link" size="sm" asChild><a href="/professor/avisos">Todos os avisos</a></Button>}
      <DialogTrigger asChild><Button type="button" size={firstNotice ? "default" : "sm"}>{!firstNotice && <Plus aria-hidden />}{firstNotice ? "Publicar primeiro aviso" : "Novo aviso"}</Button></DialogTrigger>
    </div>
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
      <DialogHeader><DialogTitle>Novo aviso</DialogTitle><DialogDescription>Publique um comunicado para os alunos desta turma.</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={publish}>
        <div className="rounded-md border border-border bg-card-2 px-3 py-2.5"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Turma</p><p className="mt-1 text-sm font-semibold text-foreground">{className}</p></div>
        <label className="block text-sm font-semibold text-foreground" htmlFor="announcement-title">Título<input id="announcement-title" required maxLength={140} className="mt-1.5 min-h-11 w-full rounded-md border border-input bg-card px-3 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-glow" /></label>
        <label className="block text-sm font-semibold text-foreground" htmlFor="announcement-message">Mensagem<Textarea id="announcement-message" required maxLength={2000} className="mt-1.5 min-h-32 bg-card font-normal" /></label>
        {unavailable && <p role="alert" className="rounded-md border border-danger-border bg-danger-dim px-3 py-2 text-sm text-danger-text">Ainda não é possível publicar avisos: a estrutura atual não possui suporte para salvar o título e gerar as notificações dos alunos.</p>}
        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Publicar aviso</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
