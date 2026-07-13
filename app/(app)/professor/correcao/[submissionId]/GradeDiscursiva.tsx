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
    <div className="flex flex-col gap-2.5 p-0">
      <div className="grid grid-cols-1 gap-3.5 min-[861px]:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="block text-sm font-semibold text-foreground" htmlFor={`score-${questionId}`}>Nota (0 a 1)</label>
          <input id={`score-${questionId}`} className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" type="number" min={0} max={1} step={0.05} value={score} onChange={(e) => setScore(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="block text-sm font-semibold text-foreground" htmlFor={`feedback-${questionId}`}>Feedback</label>
          <textarea id={`feedback-${questionId}`} className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>
      </div>
      {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" disabled={pending} onClick={onSuggest}>
          {pending ? <AiThinking label="Avaliando" /> : "Sugerir com IA"}
        </button>
        <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-3 py-[7px] text-sm" disabled={!score} onClick={onApprove}>
          Aprovar nota
        </button>
      </div>
    </div>
  );
}
