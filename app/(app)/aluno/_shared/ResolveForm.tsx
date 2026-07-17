"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitAnswers } from "./actions";

export interface ResolveQuestion {
  id: string;
  type: "MULTIPLA" | "VF" | "DISCURSIVA";
  statement: string;
  options: { id: string; text: string }[] | null;
}

export function ResolveForm({
  parent,
  questions,
}: {
  parent: { assignmentId: string } | { simuladoId: string };
  questions: ResolveQuestion[];
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const allAnswered = questions.every((q) => (answers[q.id] ?? "").trim().length > 0);

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await submitAnswers(parent, answers);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5" data-testid="resolve-form">
      {questions.map((q, i) => (
        <section key={q.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors" data-testid={`question-${q.id}`}>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2 py-[3px] font-display text-2xs font-bold tracking-[0.5px] uppercase text-muted-foreground">Questão {i + 1}</div>
            </div>
          </div>
          <div className="flex flex-col gap-4.5 p-5.5">
            <p className="mb-3.5 text-[14.5px] leading-relaxed text-foreground">{q.statement}</p>

            {q.type !== "DISCURSIVA" && q.options && (
              <div className="flex flex-col gap-2">
                {q.options.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name={`answer-${q.id}`}
                      data-testid={`answer-${q.id}-${opt.id}`}
                      checked={answers[q.id] === opt.id}
                      onChange={() => setAnswer(q.id, opt.id)}
                    />
                    <span className="shrink-0 font-display font-bold text-brand-text">{opt.id}</span>
                    <span>{opt.text}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "DISCURSIVA" && (
              <textarea
                data-testid={`answer-${q.id}`}
                className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="Digite sua resposta..."
              />
            )}
          </div>
        </section>
      ))}

      {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3.5">
        <button data-testid="resolve-submit" type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 h-11.5 min-w-40 rounded-full px-5 font-display text-base tracking-[-0.2px]" disabled={pending || !allAnswered}>
          {pending ? "Enviando…" : "Enviar respostas"}
        </button>
      </div>
    </form>
  );
}
