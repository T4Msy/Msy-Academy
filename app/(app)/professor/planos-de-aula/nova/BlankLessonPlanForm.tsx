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
    <form className="flex flex-col gap-3.5" onSubmit={handleSubmit} noValidate>
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
        <div className="flex flex-col gap-4.5 p-5.5">
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-semibold text-foreground" htmlFor="blank-theme">Tema da aula</label>
            <input className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="blank-theme" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Ex: Revolução Industrial" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-semibold text-foreground" htmlFor="blank-objectives">Objetivos (opcional)</label>
            <textarea className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="blank-objectives" value={objectives} onChange={(e) => setObjectives(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-semibold text-foreground" htmlFor="blank-content">Conteúdo (opcional)</label>
            <textarea className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="blank-content" value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-semibold text-foreground" htmlFor="blank-activities">Atividades sugeridas (opcional)</label>
            <textarea className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="blank-activities" value={suggestedActivities} onChange={(e) => setSuggestedActivities(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-semibold text-foreground" htmlFor="blank-assessments">Avaliação sugerida (opcional)</label>
            <textarea className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="blank-assessments" value={suggestedAssessments} onChange={(e) => setSuggestedAssessments(e.target.value)} />
          </div>

          {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3.5">
            <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-4 py-2.5" disabled={pending}>
              {pending ? "Criando…" : "Criar plano de aula"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
