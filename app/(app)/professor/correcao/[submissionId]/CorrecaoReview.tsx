"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GradeDiscursiva } from "./GradeDiscursiva";
import { saveGrade } from "../actions";

export interface DiscursivaItem {
  questionId: string;
  statement: string;
  referenceAnswer: string;
  studentAnswer: string;
}

export function CorrecaoReview({
  submissionId,
  objectiveScoreSum,
  discursivas,
  returnHref = "/professor/correcao",
  nextHref,
}: {
  submissionId: string;
  objectiveScoreSum: number;
  discursivas: DiscursivaItem[];
  returnHref?: string;
  nextHref?: string | null;
}) {
  const [scores, setScores] = useState<Record<string, { score: number; feedback: string }>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const allGraded = discursivas.every((d) => scores[d.questionId] !== undefined);
  const totalScore = objectiveScoreSum + Object.values(scores).reduce((sum, s) => sum + s.score, 0);

  function onFinalize() {
    setError(null);
    const feedback = Object.values(scores).map((s) => s.feedback).filter(Boolean).join(" ");
    startTransition(async () => {
      try {
        await saveGrade(submissionId, totalScore, feedback, "TEACHER");
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não conseguimos salvar a correção. Tente novamente.");
      }
    });
  }

  return (
    <>
      {discursivas.map((d, i) => (
        <section key={d.questionId} className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2 py-[3px] font-display text-2xs font-bold tracking-[0.5px] uppercase text-muted-foreground">Discursiva {i + 1}</div>
              {scores[d.questionId] && <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">Nota: {scores[d.questionId].score}</span>}
            </div>
          </div>
          <div className="flex flex-col gap-4.5 p-5.5">
            <p className="mb-3.5 text-[14.5px] leading-relaxed text-foreground">{d.statement}</p>
            <p className="text-[13.5px] leading-relaxed text-muted-foreground"><b>Resposta do aluno:</b> {d.studentAnswer}</p>
            <p className="text-[13.5px] leading-relaxed text-muted-foreground"><b>Resposta de referência:</b> {d.referenceAnswer}</p>
            <GradeDiscursiva
              submissionId={submissionId}
              questionId={d.questionId}
              statement={d.statement}
              referenceAnswer={d.referenceAnswer}
              studentAnswer={d.studentAnswer}
              onSaved={(score, feedback) => setScores((prev) => ({ ...prev, [d.questionId]: { score, feedback } }))}
            />
          </div>
        </section>
      ))}

      {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}

      {saved && <div role="status" className="mt-4 rounded-lg border border-brand-border bg-brand-dim p-4"><p className="font-semibold text-brand-text">Correção salva.</p><p className="mt-1 text-sm text-muted-foreground">{nextHref ? "A próxima entrega está pronta para você continuar." : "Você concluiu todas as entregas desta atividade."}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => router.push(nextHref ?? returnHref)} className="inline-flex min-h-11 items-center justify-center rounded-sm bg-primary px-4 text-sm font-bold text-primary-foreground">{nextHref ? "Próxima entrega" : "Voltar para a turma"}</button>{nextHref && <button type="button" onClick={() => router.push(returnHref)} className="inline-flex min-h-11 items-center justify-center rounded-sm border border-border px-4 text-sm font-semibold text-foreground">Voltar para a turma</button>}</div></div>}

      {!saved && <div className="mt-2 flex flex-wrap items-center justify-between gap-3.5">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">Nota total: {totalScore}</span>
        <button data-testid="correcao-finalize" type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 h-11.5 min-w-40 rounded-full px-5 font-display text-base tracking-[-0.2px]" disabled={!allGraded || pending} onClick={onFinalize}>
          {pending ? "Salvando…" : "Salvar correção"}
        </button>
      </div>}
    </>
  );
}
