"use client";

import { useActionState } from "react";
import type { LessonPlanFormState } from "@/lib/lesson-plans/types";

const initialState: LessonPlanFormState = {};

const FIELDS: { name: keyof PlanSections; label: string }[] = [
  { name: "objectives", label: "Objetivos" },
  { name: "content", label: "Conteúdo" },
  { name: "suggested_activities", label: "Atividades sugeridas" },
  { name: "suggested_assessments", label: "Avaliação sugerida" },
];

interface PlanSections {
  objectives: string | null;
  content: string | null;
  suggested_activities: string | null;
  suggested_assessments: string | null;
}

/**
 * Editor de corpo do plano de aula — form único (Editar/Salvar global,
 * não por-campo como QuestionsEditor), porque o shape aqui é 4 campos de
 * texto livre numa linha, não uma lista de itens. Tema continua editável
 * só via RenameDeleteMenu no cabeçalho, mesmo padrão de Provas/Atividades.
 */
export function LessonPlanEditor({
  plan,
  action,
}: {
  plan: PlanSections;
  action: (prevState: LessonPlanFormState | null, formData: FormData) => Promise<LessonPlanFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form className="flex flex-col gap-3.5" action={formAction}>
      <div className="flex flex-col gap-3.5">
        {FIELDS.map((f) => (
          <section key={f.name} className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">{f.label}</h2>
              </div>
            </div>
            <div className="flex flex-col gap-4.5 p-5.5">
              <textarea
                className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
                id={f.name}
                name={f.name}
                defaultValue={plan[f.name] ?? ""}
                rows={5}
              />
            </div>
          </section>
        ))}
      </div>

      {state.error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{state.error}</div>}
      {state.ok && !state.error && <div className="mt-3.5 rounded-md border border-brand-border bg-brand-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-brand-text">Plano de aula salvo.</div>}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3.5">
        <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-4 py-2.5" disabled={pending}>
          {pending ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
