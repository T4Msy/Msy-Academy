"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmScan } from "./actions";

export interface ReviewQuestion {
  questionId: string;
  position: number;
  statement: string;
  options: { id: string; text: string }[];
  detectedLetter: string | null;
  confidence: number;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E"] as const;

/** Below this, the OMR pipeline itself declined to guess — flag it for extra attention. */
const LOW_CONFIDENCE_THRESHOLD = 25;

export function GabaritoReview({
  scanId,
  photoUrl,
  questions,
}: {
  scanId: string;
  photoUrl: string | null;
  questions: ReviewQuestion[];
}) {
  const [answers, setAnswers] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(questions.map((q) => [q.questionId, q.detectedLetter])),
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const lowConfidenceCount = questions.filter((q) => q.detectedLetter === null || q.confidence < LOW_CONFIDENCE_THRESHOLD).length;

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await confirmScan(scanId, answers);
        router.push("/professor/correcao");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não conseguimos confirmar o gabarito. Tente novamente.");
      }
    });
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5">
      {photoUrl && (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
          <div className="flex flex-col gap-4.5 p-5.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- external signed Supabase Storage URL, not a static asset */}
            <img src={photoUrl} alt="Foto do cartão-resposta enviado" className="scan-review-photo" />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {lowConfidenceCount > 0 && (
          <div className="mt-3.5 rounded-md border border-brand-border bg-brand-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-brand-text">
            {lowConfidenceCount} questõe{lowConfidenceCount > 1 ? "s" : ""} com leitura pouco confiável — confira com atenção.
          </div>
        )}

        {questions.map((q) => {
          const isLow = q.detectedLetter === null || q.confidence < LOW_CONFIDENCE_THRESHOLD;
          return (
            <section key={q.questionId} className={`overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors ${isLow ? "border-brand-border" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2 py-[3px] font-display text-2xs font-bold tracking-[0.5px] uppercase text-muted-foreground">Questão {q.position}</div>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{q.detectedLetter ? `Detectado: ${q.detectedLetter}` : "Não detectado"}</span>
                </div>
              </div>
              <div className="flex flex-col gap-4.5 p-5.5">
                <p className="mb-3.5 text-[14.5px] leading-relaxed text-foreground">{q.statement}</p>
                <div className="flex items-center gap-2">
                  {OPTION_LETTERS.map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 px-3 py-[7px] text-sm ${answers[q.questionId] === letter ? "bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90" : "border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)]"}`}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.questionId]: letter }))}
                    >
                      {letter}
                    </button>
                  ))}
                  <button
                    key="none"
                    type="button"
                    className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 px-3 py-[7px] text-sm ${answers[q.questionId] === null ? "bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90" : "border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)]"}`}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.questionId]: null }))}
                  >
                    Sem resposta
                  </button>
                </div>
              </div>
            </section>
          );
        })}

        {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3.5">
          <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 h-11.5 min-w-40 rounded-full px-5 font-display text-base tracking-[-0.2px]" disabled={pending} onClick={onConfirm}>
            {pending ? "Confirmando…" : "Confirmar respostas"}
          </button>
        </div>
      </div>
    </div>
  );
}
