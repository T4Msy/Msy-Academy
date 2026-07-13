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
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <div className="grid-two-col">
      {photoUrl && (
        <div className="card">
          <div className="card-body">
            {/* eslint-disable-next-line @next/next/no-img-element -- external signed Supabase Storage URL, not a static asset */}
            <img src={photoUrl} alt="Foto do cartão-resposta enviado" className="scan-review-photo" />
          </div>
        </div>
      )}

      <div className="stack-md">
        {lowConfidenceCount > 0 && (
          <div className="notice">
            {lowConfidenceCount} questõe{lowConfidenceCount > 1 ? "s" : ""} com leitura pouco confiável — confira com atenção.
          </div>
        )}

        {questions.map((q) => {
          const isLow = q.detectedLetter === null || q.confidence < LOW_CONFIDENCE_THRESHOLD;
          return (
            <section key={q.questionId} className={`card question-card${isLow ? " question-card--flagged" : ""}`}>
              <div className="card-header">
                <div className="card-title-group">
                  <div className="step-badge">Questão {q.position}</div>
                  <span className="chip">{q.detectedLetter ? `Detectado: ${q.detectedLetter}` : "Não detectado"}</span>
                </div>
              </div>
              <div className="card-body">
                <p className="question-statement">{q.statement}</p>
                <div className="inline-gap-sm">
                  {OPTION_LETTERS.map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      className={`btn btn-sm ${answers[q.questionId] === letter ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.questionId]: letter }))}
                    >
                      {letter}
                    </button>
                  ))}
                  <button
                    key="none"
                    type="button"
                    className={`btn btn-sm ${answers[q.questionId] === null ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.questionId]: null }))}
                  >
                    Sem resposta
                  </button>
                </div>
              </div>
            </section>
          );
        })}

        {error && <div className="notice notice--error">{error}</div>}

        <div className="submit-row">
          <button type="button" className="btn btn-primary btn-generate" disabled={pending} onClick={onConfirm}>
            {pending ? "Confirmando…" : "Confirmar respostas"}
          </button>
        </div>
      </div>
    </div>
  );
}
