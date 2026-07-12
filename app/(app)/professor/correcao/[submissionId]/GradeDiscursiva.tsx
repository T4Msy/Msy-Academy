"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { suggestGrade } from "../actions";
import { AiThinking } from "@/components/AiThinking";

export function GradeDiscursiva({
  submissionId,
  questionId,
  statement,
  referenceAnswer,
  studentAnswer,
  onSaved,
}: {
  submissionId: string;
  questionId: string;
  statement: string;
  referenceAnswer: string;
  studentAnswer: string;
  onSaved: (score: number, feedback: string) => void;
}) {
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function onSuggest() {
    setError(null);
    startTransition(async () => {
      try {
        const suggestion = await suggestGrade(submissionId, statement, referenceAnswer, studentAnswer);
        setScore(String(suggestion.score));
        setFeedback(suggestion.feedback);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  function onApprove() {
    const parsed = Number(score);
    if (Number.isNaN(parsed)) {
      setError("Informe uma nota válida.");
      return;
    }
    onSaved(parsed, feedback);
    router.refresh();
  }

  return (
    <div className="popover-form popover-form--flush">
      <div className="form-grid-2">
        <div className="form-field">
          <label className="field-label" htmlFor={`score-${questionId}`}>Nota (0 a 1)</label>
          <input id={`score-${questionId}`} className="input" type="number" min={0} max={1} step={0.05} value={score} onChange={(e) => setScore(e.target.value)} />
        </div>
        <div className="form-field form-field--full">
          <label className="field-label" htmlFor={`feedback-${questionId}`}>Feedback</label>
          <textarea id={`feedback-${questionId}`} className="input" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>
      </div>
      {error && <div className="notice notice--error">{error}</div>}
      <div className="popover-row">
        <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={onSuggest}>
          {pending ? <AiThinking label="Avaliando" /> : "Sugerir com IA"}
        </button>
        <button type="button" className="btn btn-primary btn-sm" disabled={!score} onClick={onApprove}>
          Aprovar nota
        </button>
      </div>
    </div>
  );
}
