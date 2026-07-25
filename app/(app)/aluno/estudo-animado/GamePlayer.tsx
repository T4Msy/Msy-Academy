"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Flame, Heart, Rocket, Shield, Sparkles, Star, Trophy, X, Zap } from "lucide-react";
import type { StudyGameRun } from "@/lib/study-game/types";
import { answerStudyGameQuestion } from "./actions";

const stageNames = ["Partida", "Aquecimento", "Ritmo", "Desafio", "Virada", "Turbo", "Foco", "Elite", "Final", "Lenda"];

function difficultyForStage(index: number) {
  if (index < 10) return "Iniciante";
  if (index < 20) return "Intermediário";
  if (index < 40) return "Avançado";
  if (index < 60) return "Elite";
  if (index < 100) return "Extremo";
  return "Lendário";
}

export function GamePlayer({ initialRun }: { initialRun: StudyGameRun }) {
  const [run, setRun] = useState(initialRun);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; correctAnswer: string; text: string | null } | null>(null);
  const [nextRun, setNextRun] = useState<StudyGameRun | null>(null);
  const [preparingNextStage, setPreparingNextStage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const question = run.questions[run.currentQuestionIndex];
  const finished = run.status !== "ACTIVE" || !question;
  const displayRun = nextRun ?? run;
  const progress = Math.round(((run.currentQuestionIndex % 10) / 10) * 100);

  function submit() {
    if (!selected || feedback) return;
    setError(null);
    const needsNewBatch = (run.currentQuestionIndex + 1) % 10 === 0;
    if (needsNewBatch) setPreparingNextStage(true);
    startTransition(async () => {
      try {
        const result = await answerStudyGameQuestion(run.id, run.currentQuestionIndex, selected);
        setFeedback({ correct: result.isCorrect, correctAnswer: result.correctAnswer, text: result.explanation });
        setNextRun({ ...run, questions: [...run.questions, ...result.appendedQuestions], score: result.score, combo: result.combo, livesRemaining: result.livesRemaining, status: result.status, currentQuestionIndex: result.nextQuestionIndex, correctCount: run.correctCount + (result.isCorrect ? 1 : 0) });
      } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível registrar sua resposta."); } finally { setPreparingNextStage(false); }
    });
  }

  function continueGame() {
    if (!nextRun) return;
    setRun(nextRun);
    setNextRun(null);
    setFeedback(null);
    setSelected(null);
  }

  if (finished) {
    const won = run.status === "WON";
    return <section className="relative mx-auto max-w-xl overflow-hidden rounded-[28px] border border-brand-border bg-card p-8 text-center shadow-elevated">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,rgba(217,119,87,.3),transparent_68%)]" />
      <div className="relative"><div className={`mx-auto flex size-20 items-center justify-center rounded-full border-4 ${won ? "border-brand bg-brand-dim" : "border-danger-border bg-danger-dim"}`}>{won ? <Trophy size={38} className="text-brand" /> : <Shield size={36} className="text-danger" />}</div><p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-brand-text">Resultado da missão</p><h1 className="mt-2 font-display text-4xl font-extrabold">{won ? "Missão concluída!" : "Você chegou longe!"}</h1><p className="mx-auto mt-3 max-w-sm text-muted-foreground">{won ? "Você atravessou todas as fases." : "Treino bom é assim: você aprende, volta mais forte e bate o recorde."}</p><div className="mt-7 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card-2 py-4"><div><b className="block text-2xl text-brand-text">{run.score}</b><span className="text-[11px] uppercase tracking-wide text-muted-foreground">XP ganhos</span></div><div><b className="block text-2xl">{run.correctCount}/{run.questions.length}</b><span className="text-[11px] uppercase tracking-wide text-muted-foreground">acertos</span></div><div><b className="block text-2xl text-warning">x{Math.max(1, run.combo)}</b><span className="text-[11px] uppercase tracking-wide text-muted-foreground">combo final</span></div></div><button onClick={() => router.replace("/aluno/estudo-animado")} className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-display font-bold text-primary-foreground"><Rocket size={18} /> Escolher nova missão</button></div>
    </section>;
  }

  if (preparingNextStage) {
    const nextLevel = difficultyForStage(run.currentQuestionIndex + 1);
    return <section className="relative mx-auto flex min-h-[560px] max-w-3xl items-center justify-center overflow-hidden rounded-[28px] border border-brand-border bg-[#20110c] p-8 text-center text-white shadow-elevated">
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:radial-gradient(#f8c5a9_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/25 blur-3xl" />
      <div className="relative flex max-w-sm flex-col items-center">
        <div className="relative flex size-40 items-center justify-center">
          <div className="absolute inset-2 animate-ping rounded-full border border-[#f8c5a9]/40" />
          <div className="absolute bottom-1 h-4 w-24 animate-pulse rounded-[100%] bg-black/30 blur-sm" />
          <div className="relative animate-[bounce_1.1s_ease-in-out_infinite] text-7xl drop-shadow-[0_12px_12px_rgba(0,0,0,.35)]" role="img" aria-label="Capi, a capivara exploradora">🦫</div>
          <Rocket size={28} className="absolute right-1 top-5 rotate-45 animate-[pulse_1s_ease-in-out_infinite] text-[#f8c5a9]" />
          <Sparkles size={19} className="absolute left-2 top-8 animate-[pulse_1.3s_ease-in-out_infinite] text-[#ffd166]" />
        </div>
        <p className="mt-7 text-xs font-black uppercase tracking-[.2em] text-[#f8c5a9]">Capi está explorando</p>
        <h2 className="mt-3 font-display text-3xl font-extrabold">Preparando a próxima rota…</h2>
        <p className="mt-3 text-sm leading-relaxed text-white/70">Você chegou longe! A Capi está montando desafios de nível <b className="text-white">{nextLevel}</b> para a próxima etapa.</p>
        <div className="mt-7 h-2 w-56 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-brand to-[#f8c5a9]" /></div>
        <p className="mt-3 text-xs text-white/50">Isso pode levar alguns segundos.</p>
      </div>
    </section>;
  }

  return <section className="mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-border bg-card shadow-elevated">
    <header className="relative overflow-hidden border-b border-border bg-[#20110c] px-5 pb-7 pt-5 text-white sm:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#f8c5a9_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="relative flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-brand text-primary-foreground shadow-[0_0_24px_rgba(217,119,87,.55)]"><Rocket size={21} /></span><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#f8c5a9]">Expedição do saber</p><h1 className="font-display text-lg font-extrabold">{run.subject}</h1></div></div><div className="rounded-xl border border-white/15 bg-black/20 px-3 py-1.5 text-right"><span className="block text-[10px] font-bold uppercase tracking-wide text-white/60">energia</span><span className="flex justify-end gap-0.5">{Array.from({ length: 3 }, (_, i) => <Heart key={i} size={16} className={i < displayRun.livesRemaining ? "fill-[#ff7b6d] text-[#ff7b6d]" : "text-white/20"} />)}</span></div></div>
      <div className="relative mt-7"><div className="mb-2 flex items-center justify-between text-xs font-bold"><span>FASE {run.currentQuestionIndex + 1} · {stageNames[run.currentQuestionIndex % 10] ?? "Lenda"}</span><span>{difficultyForStage(run.currentQuestionIndex)} · rota infinita</span></div><div className="h-3 rounded-full bg-black/35 p-0.5"><div className="h-2 rounded-full bg-gradient-to-r from-[#f8c5a9] to-brand shadow-[0_0_14px_rgba(248,197,169,.8)] transition-all duration-500" style={{ width: `${Math.max(6, progress)}%` }} /></div><div className="absolute -bottom-4 transition-all duration-500" style={{ left: `calc(${Math.max(5, progress)}% - 13px)` }}><Rocket size={26} className="rotate-45 text-[#ffe0ce] drop-shadow-[0_0_8px_rgba(255,224,206,.9)]" /></div></div>
    </header>

    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card-2 px-5 py-3 sm:px-8"><div className="inline-flex items-center gap-2 text-sm"><span className="flex size-8 items-center justify-center rounded-full bg-brand-dim text-brand-text"><Star size={16} fill="currentColor" /></span><b>{displayRun.score} XP</b></div><div className="inline-flex items-center gap-2 rounded-full bg-[#f59e0b]/10 px-3 py-1 text-sm font-bold text-[#d97706]"><Flame size={16} fill="currentColor" /> combo x{Math.max(1, displayRun.combo)}</div></div>

    <article className="p-5 sm:p-8"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-brand-dim text-brand-text"><Sparkles size={18} /></span><p className="text-xs font-black uppercase tracking-[.16em] text-muted-foreground">Desafio {run.currentQuestionIndex + 1} · nível {difficultyForStage(run.currentQuestionIndex)}</p></div><h2 className="mt-5 font-display text-2xl font-extrabold leading-snug text-foreground sm:text-3xl">{question.statement}</h2><p className="mt-2 text-sm text-muted-foreground">Escolha sua resposta para avançar pela rota infinita.</p>
      <div className="mt-7 grid gap-3">{question.options.map((option, index) => { const selectedOption = selected === option.id; const correctOption = feedback?.correctAnswer === option.id; const incorrectSelection = Boolean(feedback && !feedback.correct && selectedOption); const stateClass = correctOption ? "border-brand bg-brand-dim shadow-[0_8px_24px_rgba(217,119,87,.14)]" : incorrectSelection ? "border-danger-border bg-danger-dim" : selectedOption ? "border-brand bg-brand-dim shadow-[0_8px_24px_rgba(217,119,87,.14)]" : "border-border bg-card hover:-translate-y-0.5 hover:border-brand-border hover:bg-card-2"; const markerClass = correctOption ? "bg-brand text-primary-foreground" : incorrectSelection ? "bg-danger text-white" : selectedOption ? "bg-brand text-primary-foreground" : "bg-card-2 text-muted-foreground group-hover:text-brand-text"; return <button key={option.id} type="button" disabled={pending || Boolean(feedback)} onClick={() => setSelected(option.id)} className={`group flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 ${stateClass}`}><span className={`flex size-9 shrink-0 items-center justify-center rounded-xl font-display font-extrabold ${markerClass}`}>{correctOption ? <Check size={18} /> : incorrectSelection ? <X size={18} /> : String.fromCharCode(65 + index)}</span><span className="font-semibold text-foreground">{option.text}</span>{correctOption && feedback && !feedback.correct && <span className="ml-auto text-xs font-bold text-brand-text">Resposta correta</span>}</button>; })}</div>
      {feedback && <div className={`mt-6 flex gap-3 rounded-2xl border p-4 ${feedback.correct ? "border-brand-border bg-brand-dim" : "border-danger-border bg-danger-dim"}`}><span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${feedback.correct ? "bg-brand text-primary-foreground" : "bg-danger text-white"}`}>{feedback.correct ? <Check size={19} /> : <X size={19} />}</span><div><b className="block font-display text-lg">{feedback.correct ? "Acertou em cheio!" : "Essa fase escapou."}</b><p className="mt-1 text-sm text-muted-foreground">{feedback.text ?? (feedback.correct ? "Seu combo aumentou. Continue assim!" : "Leia a explicação, ajuste a estratégia e siga em frente.")}</p></div></div>}
      {error && <p className="mt-4 text-sm text-danger-text">{error}</p>}<button type="button" disabled={pending || (!selected && !feedback)} onClick={feedback ? continueGame : submit} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-display text-lg font-extrabold text-primary-foreground transition hover:translate-y-[-1px] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Avaliando sua jogada…" : feedback ? (nextRun?.status === "ACTIVE" ? "Seguir para a próxima fase" : "Ver meu resultado") : "Confirmar jogada"}{!pending && <ChevronRight size={20} />}</button>
    </article>
  </section>;
}
