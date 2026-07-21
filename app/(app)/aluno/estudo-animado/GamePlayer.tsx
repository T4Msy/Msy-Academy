"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Trophy, Zap } from "lucide-react";
import type { StudyGameRun } from "@/lib/study-game/types";
import { answerStudyGameQuestion } from "./actions";

export function GamePlayer({ initialRun }: { initialRun: StudyGameRun }) {
  const [run, setRun] = useState(initialRun);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string | null } | null>(null);
  const [nextRun, setNextRun] = useState<StudyGameRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const question = run.questions[run.currentQuestionIndex];
  const finished = run.status !== "ACTIVE" || !question;

  function submit() {
    if (!selected || feedback) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await answerStudyGameQuestion(run.id, run.currentQuestionIndex, selected);
        setFeedback({ correct: result.isCorrect, text: result.explanation });
        setNextRun({ ...run, score: result.score, combo: result.combo, livesRemaining: result.livesRemaining, status: result.status, currentQuestionIndex: result.nextQuestionIndex, correctCount: run.correctCount + (result.isCorrect ? 1 : 0) });
      } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível registrar sua resposta."); }
    });
  }

  function continueGame() {
    if (!nextRun) return;
    setRun(nextRun);
    setNextRun(null);
    setFeedback(null);
    setSelected(null);
  }

  if (finished) return <section className="mx-auto max-w-xl rounded-xl border border-brand-border bg-card p-7 text-center shadow-elevated"><Trophy className="mx-auto size-12 text-brand" /><h1 className="mt-4 font-display text-3xl font-extrabold">{run.status === "WON" ? "Missão concluída!" : "Fim da missão"}</h1><p className="mt-2 text-muted-foreground">Você fez {run.score} pontos e acertou {run.correctCount} de {run.questions.length} desafios.</p><button onClick={() => router.replace("/aluno/estudo-animado")} className="mt-6 rounded-full bg-primary px-5 py-3 font-display font-bold text-primary-foreground">Voltar ao Estudo Animado</button></section>;

  return <section className="mx-auto max-w-2xl"><div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"><span className="font-display font-bold">{run.subject}</span><div className="flex items-center gap-3 text-sm"><span className="inline-flex items-center gap-1"><Trophy size={16} className="text-brand" />{nextRun?.score ?? run.score}</span><span className="inline-flex items-center gap-1"><Zap size={16} className="text-warning" />x{Math.max(1, nextRun?.combo ?? run.combo)}</span><span className="flex gap-0.5">{Array.from({ length: 3 }, (_, i) => <Heart key={i} size={17} className={i < (nextRun?.livesRemaining ?? run.livesRemaining) ? "fill-danger text-danger" : "text-muted"} />)}</span></div></div><div className="mb-5 h-2 overflow-hidden rounded-full bg-border"><div className="h-full bg-brand transition-all" style={{ width: `${(run.currentQuestionIndex / run.questions.length) * 100}%` }} /></div><article className="rounded-xl border border-border bg-card p-6 shadow-elevated"><p className="text-xs font-bold uppercase tracking-wide text-brand-text">Desafio {run.currentQuestionIndex + 1} de {run.questions.length}</p><h1 className="mt-3 font-display text-xl font-bold leading-snug text-foreground">{question.statement}</h1><div className="mt-6 grid gap-2">{question.options.map((option) => <button key={option.id} type="button" disabled={pending || Boolean(feedback)} onClick={() => setSelected(option.id)} className={`rounded-lg border p-3 text-left transition ${selected === option.id ? "border-brand bg-brand-dim" : "border-border hover:border-brand-border hover:bg-card-2"}`}><b className="mr-2 text-brand-text">{option.id}</b>{option.text}</button>)}</div>{feedback && <div className={`mt-5 rounded-md border p-3 text-sm ${feedback.correct ? "border-brand-border bg-brand-dim text-brand-text" : "border-danger-border bg-danger-dim text-danger-text"}`}><b>{feedback.correct ? "Boa!" : "Quase!"}</b>{feedback.text && <span> {feedback.text}</span>}</div>}{error && <p className="mt-3 text-sm text-danger-text">{error}</p>}<button type="button" disabled={pending || (!selected && !feedback)} onClick={feedback ? continueGame : submit} className="mt-6 rounded-full bg-primary px-5 py-3 font-display font-bold text-primary-foreground disabled:opacity-50">{pending ? "Validando…" : feedback ? (nextRun?.status === "ACTIVE" ? "Próximo desafio" : "Ver resultado") : "Responder"}</button></article></section>;
}
