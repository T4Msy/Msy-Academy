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
    <form onSubmit={onSubmit} className="questions-stack">
      {questions.map((q, i) => (
        <section key={q.id} className="card question-card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="step-badge">Questão {i + 1}</div>
            </div>
          </div>
          <div className="card-body">
            <p className="question-statement">{q.statement}</p>

            {q.type !== "DISCURSIVA" && q.options && (
              <div className="question-options-edit">
                {q.options.map((opt) => (
                  <label key={opt.id} className="question-option-edit-row">
                    <input
                      type="radio"
                      name={`answer-${q.id}`}
                      checked={answers[q.id] === opt.id}
                      onChange={() => setAnswer(q.id, opt.id)}
                    />
                    <span className="question-option-id">{opt.id}</span>
                    <span>{opt.text}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "DISCURSIVA" && (
              <textarea
                className="input"
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="Digite sua resposta..."
              />
            )}
          </div>
        </section>
      ))}

      {error && <div className="notice notice--error">{error}</div>}

      <div className="submit-row">
        <button type="submit" className="btn btn-primary btn-generate" disabled={pending || !allAnswered}>
          {pending ? "Enviando…" : "Enviar respostas"}
        </button>
      </div>
    </form>
  );
}
