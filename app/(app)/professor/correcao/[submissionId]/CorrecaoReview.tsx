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
}: {
  submissionId: string;
  objectiveScoreSum: number;
  discursivas: DiscursivaItem[];
}) {
  const [scores, setScores] = useState<Record<string, { score: number; feedback: string }>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const allGraded = discursivas.every((d) => scores[d.questionId] !== undefined);
  const totalScore = objectiveScoreSum + Object.values(scores).reduce((sum, s) => sum + s.score, 0);

  function onFinalize() {
    setError(null);
    const feedback = Object.values(scores).map((s) => s.feedback).filter(Boolean).join(" ");
    startTransition(async () => {
      try {
        await saveGrade(submissionId, totalScore, feedback, "AI_SUGGESTED");
        router.push("/professor/correcao");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <>
      {discursivas.map((d, i) => (
        <section key={d.questionId} className="card question-card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="step-badge">Discursiva {i + 1}</div>
              {scores[d.questionId] && <span className="chip">Nota: {scores[d.questionId].score}</span>}
            </div>
          </div>
          <div className="card-body">
            <p className="question-statement">{d.statement}</p>
            <p className="question-reference-answer"><b>Resposta do aluno:</b> {d.studentAnswer}</p>
            <p className="question-reference-answer"><b>Resposta de referência:</b> {d.referenceAnswer}</p>
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

      {error && <div className="notice notice--error">{error}</div>}

      <div className="submit-row">
        <span className="chip">Nota total: {totalScore}</span>
        <button type="button" className="btn btn-primary btn-generate" disabled={!allGraded || pending} onClick={onFinalize}>
          {pending ? "Salvando…" : "Concluir correção"}
        </button>
      </div>
    </>
  );
}
