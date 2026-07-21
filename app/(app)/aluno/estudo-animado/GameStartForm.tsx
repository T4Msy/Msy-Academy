"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { startStudyGame } from "./actions";

export function GameStartForm({ suggestions }: { suggestions: string[] }) {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function start() {
    setError(null);
    startTransition(async () => {
      try {
        const id = await startStudyGame({ subject, topic: topic || undefined });
        router.push(`/aluno/estudo-animado/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível iniciar a missão.");
      }
    });
  }

  return (
    <section className="rounded-xl border border-brand-border bg-brand-dim p-5 sm:p-6">
      <div className="flex items-start gap-3"><span className="flex size-11 items-center justify-center rounded-lg bg-brand text-primary-foreground"><Sparkles size={21} /></span><div><h2 className="font-display text-xl font-bold text-foreground">Qual matéria você quer dominar?</h2><p className="mt-1 text-sm text-muted-foreground">Monte uma missão rápida, ganhe pontos e tente bater seu recorde.</p></div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">Matéria<input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Ex.: Matemática" className="rounded-md border border-border bg-card px-3 py-2.5 font-normal text-foreground outline-none focus:border-brand-border focus:ring-2 focus:ring-brand-glow" /></label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">Tema <span className="font-normal text-muted-foreground">(opcional)</span><input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Ex.: Frações" className="rounded-md border border-border bg-card px-3 py-2.5 font-normal text-foreground outline-none focus:border-brand-border focus:ring-2 focus:ring-brand-glow" /></label>
      </div>
      {suggestions.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{suggestions.map((name) => <button key={name} type="button" onClick={() => setSubject(name)} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground hover:border-brand-border hover:text-foreground">{name}</button>)}</div>}
      {error && <p className="mt-3 text-sm text-danger-text">{error}</p>}
      <button type="button" disabled={pending || subject.trim().length < 2} onClick={start} className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-display font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Preparando missão…" : "Começar missão"}<Sparkles size={18} /></button>
    </section>
  );
}
