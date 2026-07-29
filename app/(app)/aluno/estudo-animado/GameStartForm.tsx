"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Target, Zap } from "lucide-react";
import { startStudyGame } from "./actions";

export function GameStartForm({ suggestions, lastSubject, totalSessions }: { suggestions: string[]; lastSubject: string | null; totalSessions: number }) {
  const [subject, setSubject] = useState(lastSubject ?? "");
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
        setError(err instanceof Error ? err.message : "Não foi possível preparar sua sessão.");
      }
    });
  }

  if (pending) {
    return <section className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[28px] border border-brand-border bg-[#20110c] p-8 text-center text-white shadow-elevated">
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:radial-gradient(#f8c5a9_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/25 blur-3xl" />
      <div className="relative flex max-w-sm flex-col items-center"><div className="flex size-24 items-center justify-center rounded-full border border-[#f8c5a9]/40 bg-brand/20"><Sparkles size={34} className="animate-pulse text-[#f8c5a9]" /></div><p className="mt-7 text-xs font-black uppercase tracking-[.2em] text-[#f8c5a9]">Preparando sua sessão</p><h2 className="mt-3 font-display text-3xl font-extrabold">Seu próximo passo está chegando</h2><p className="mt-3 text-sm leading-relaxed text-white/70">Vamos organizar uma sequência de desafios para <b className="text-white">{subject}</b>{topic ? ` sobre ${topic}` : ""}.</p><div className="mt-7 h-2 w-56 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-brand to-[#f8c5a9]" /></div></div>
    </section>;
  }

  return <section className="relative overflow-hidden rounded-[28px] border border-brand-border bg-[#20110c] p-5 text-white shadow-elevated sm:p-8">
    <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(#f8c5a9_1px,transparent_1px)] [background-size:22px_22px]" />
    <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-brand/30 blur-3xl" />
    <div className="relative grid gap-7 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
      <div><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold tracking-wide text-[#f8c5a9]"><Sparkles size={14} /> SESSÃO DE ESTUDO</div><h2 className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl">{lastSubject ? "Continue sua evolução." : "Uma sessão rápida já faz diferença."}</h2><p className="mt-3 max-w-lg text-sm leading-relaxed text-white/70">{lastSubject ? `Você já avançou em ${lastSubject}. Continue exatamente de onde sua evolução parou.` : "Escolha um conteúdo e avance por uma sequência de desafios no seu ritmo."}</p><div className="mt-5 grid max-w-md grid-cols-3 gap-2 text-xs font-bold"><span className="rounded-xl bg-white/10 px-3 py-2"><b className="block text-white/50">Progresso</b>{totalSessions ? `${totalSessions} sessões` : "Primeira sessão"}</span><span className="rounded-xl bg-white/10 px-3 py-2"><b className="block text-white/50">Tempo</b>10 minutos</span><span className="rounded-xl bg-white/10 px-3 py-2"><b className="block text-white/50">Objetivo</b>Avançar</span></div></div>
      <div className="relative mx-auto flex w-full max-w-[240px] items-center justify-center"><div className="absolute size-48 rounded-full border border-brand/40" /><div className="absolute size-36 rounded-full border border-dashed border-[#f8c5a9]/40" /><span className="relative flex size-28 items-center justify-center rounded-[30px] border border-white/20 bg-gradient-to-br from-brand to-[#9d3f1f] shadow-[0_0_45px_rgba(217,119,87,.55)]"><Target size={46} /></span><span className="absolute right-0 top-4 rounded-xl bg-[#ffd166] px-2 py-1 text-xs font-black text-[#3c2500]">10 min</span><span className="absolute bottom-3 left-0 rounded-xl bg-white/15 px-2 py-1 text-xs font-bold"><Zap size={12} className="mr-1 inline" />No seu ritmo</span></div>
    </div>
    <div className="relative mt-7 rounded-2xl border border-white/15 bg-black/20 p-4 sm:p-5"><div className="flex items-center gap-2"><Target size={18} className="text-[#f8c5a9]" /><p className="font-display text-lg font-bold">Hoje você vai avançar em:</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="flex flex-col gap-1.5 text-sm font-bold text-white">Conteúdo<input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Ex.: Matemática" className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 font-normal text-white outline-none placeholder:text-white/40 focus:border-[#f8c5a9] focus:ring-2 focus:ring-brand-glow" /></label><label className="flex flex-col gap-1.5 text-sm font-bold text-white">Tema <span className="font-normal text-white/55">(opcional)</span><input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Ex.: Frações" className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 font-normal text-white outline-none placeholder:text-white/40 focus:border-[#f8c5a9] focus:ring-2 focus:ring-brand-glow" /></label></div>{suggestions.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{suggestions.map((name) => <button key={name} type="button" onClick={() => setSubject(name)} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-[#f8c5a9] hover:bg-white/20">{name}</button>)}</div>}{error && <p className="mt-3 text-sm text-[#ffb4ad]">{error}</p>}<button type="button" disabled={pending || subject.trim().length < 2} onClick={start} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f8c5a9] px-5 py-4 font-display font-extrabold text-[#3c1609] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Preparando…" : "Continuar"}<ArrowRight size={19} /></button></div>
  </section>;
}
