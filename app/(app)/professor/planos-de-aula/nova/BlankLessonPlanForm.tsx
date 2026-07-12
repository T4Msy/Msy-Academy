"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLessonPlan } from "../actions";

export function BlankLessonPlanForm() {
  const router = useRouter();
  const [theme, setTheme] = useState("");
  const [objectives, setObjectives] = useState("");
  const [content, setContent] = useState("");
  const [suggestedActivities, setSuggestedActivities] = useState("");
  const [suggestedAssessments, setSuggestedAssessments] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!theme.trim()) {
      setError("Informe um tema para o plano de aula.");
      return;
    }
    startTransition(async () => {
      try {
        const id = await createLessonPlan({
          theme,
          objectives,
          content,
          suggestedActivities,
          suggestedAssessments,
        });
        router.push(`/professor/planos-de-aula/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit} noValidate>
      <section className="card">
        <div className="card-body">
          <div className="form-field">
            <label className="field-label" htmlFor="blank-theme">Tema da aula</label>
            <input className="input" id="blank-theme" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Ex: Revolução Industrial" />
          </div>
          <div className="form-field">
            <label className="field-label" htmlFor="blank-objectives">Objetivos (opcional)</label>
            <textarea className="input" id="blank-objectives" value={objectives} onChange={(e) => setObjectives(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="field-label" htmlFor="blank-content">Conteúdo (opcional)</label>
            <textarea className="input" id="blank-content" value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="field-label" htmlFor="blank-activities">Atividades sugeridas (opcional)</label>
            <textarea className="input" id="blank-activities" value={suggestedActivities} onChange={(e) => setSuggestedActivities(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="field-label" htmlFor="blank-assessments">Avaliação sugerida (opcional)</label>
            <textarea className="input" id="blank-assessments" value={suggestedAssessments} onChange={(e) => setSuggestedAssessments(e.target.value)} />
          </div>

          {error && <div className="notice notice--error">{error}</div>}

          <div className="submit-row">
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Criando…" : "Criar plano de aula"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
