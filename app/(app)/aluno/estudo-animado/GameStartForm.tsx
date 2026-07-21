"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Crown, Heart, Sparkles, Target, Trophy, Zap } from "lucide-react";
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
    <section className="relative overflow-hidden rounded-[28px] border border-brand-border bg-[#20110c] p-5 text-white shadow-elevated sm:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(#f8c5a9_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-brand/30 blur-3xl" />
      <div className="relative grid gap-7 lg:grid-cols-[1.15fr_.85fr] lg:items-center"><div><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold tracking-wide text-[#f8c5a9]"><Sparkles size={14} /> MODO MISSÃO</div><h2 className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl">Aprender virou uma jornada.</h2><p className="mt-3 max-w-lg text-sm leading-relaxed text-white/70">Escolha uma matéria, enfrente 10 fases e avance com energia, combos e XP. Cada missão é feita para o tema que você quer dominar.</p><div className="mt-5 flex flex-wrap gap-2 text-xs font-bold"><span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2"><Heart size={14} className="fill-[#ff7b6d] text-[#ff7b6d]" /> 3 energias</span><span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2"><Zap size={14} className="text-[#ffd166]" /> combos dão mais XP</span><span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2"><Trophy size={14} className="text-[#ffd166]" /> recordes por matéria</span></div></div><div className="relative mx-auto flex w-full max-w-[280px] items-center justify-center"><div className="absolute size-52 rounded-full border border-brand/40" /><div className="absolute size-40 rounded-full border border-dashed border-[#f8c5a9]/40" /><span className="relative flex size-28 items-center justify-center rounded-[30px] border border-white/20 bg-gradient-to-br from-brand to-[#9d3f1f] shadow-[0_0_45px_rgba(217,119,87,.55)]"><Crown size={46} /></span><span className="absolute right-1 top-4 rounded-xl bg-[#ffd166] px-2 py-1 text-xs font-black text-[#3c2500]">+100 XP</span><span className="absolute bottom-3 left-0 rounded-xl bg-white/15 px-2 py-1 text-xs font-bold">Fase 1</span></div></div>
      <div className="relative mt-7 rounded-2xl border border-white/15 bg-black/20 p-4 sm:p-5"><div className="flex items-center gap-2"><Target size={18} className="text-[#f8c5a9]" /><p className="font-display text-lg font-bold">Defina sua missão</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="flex flex-col gap-1.5 text-sm font-bold text-white">Matéria<input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Ex.: Matemática" className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 font-normal text-white outline-none placeholder:text-white/40 focus:border-[#f8c5a9] focus:ring-2 focus:ring-brand-glow" /></label><label className="flex flex-col gap-1.5 text-sm font-bold text-white">Tema <span className="font-normal text-white/55">(opcional)</span><input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Ex.: Frações" className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 font-normal text-white outline-none placeholder:text-white/40 focus:border-[#f8c5a9] focus:ring-2 focus:ring-brand-glow" /></label></div>{suggestions.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{suggestions.map((name) => <button key={name} type="button" onClick={() => setSubject(name)} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-[#f8c5a9] hover:bg-white/20">{name}</button>)}</div>}{error && <p className="mt-3 text-sm text-[#ffb4ad]">{error}</p>}<button type="button" disabled={pending || subject.trim().length < 2} onClick={start} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f8c5a9] px-5 py-4 font-display font-extrabold text-[#3c1609] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Montando as fases…" : "Iniciar minha missão"}<ArrowRight size={19} /></button></div>
    </section>
  );
}
