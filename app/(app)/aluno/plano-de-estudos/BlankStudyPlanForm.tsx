"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBlankStudyPlan } from "./actions";

export function BlankStudyPlanForm() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [examDate, setExamDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!goal.trim()) {
      setError("Informe um objetivo para o plano.");
      return;
    }
    startTransition(async () => {
      try {
        const id = await createBlankStudyPlan(goal, examDate || undefined);
        router.push(`/aluno/plano-de-estudos/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit} noValidate>
      <section className="card">
        <div className="card-body">
          <div className="form-grid-2">
            <div className="form-field">
              <label className="field-label" htmlFor="blank-goal">Objetivo</label>
              <input className="input" id="blank-goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Ex: Passar no ENEM" />
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="blank-exam-date">Data da prova (opcional)</label>
              <input className="input" id="blank-exam-date" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
          </div>
          <p className="field-hint">Você adiciona os itens do cronograma manualmente na tela seguinte.</p>
          {error && <div className="notice notice--error">{error}</div>}
          <div className="submit-row" style={{ marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Criando…" : "Criar plano"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
