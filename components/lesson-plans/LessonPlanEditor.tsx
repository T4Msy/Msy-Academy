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
    <form className="form-stack" action={formAction}>
      <div className="questions-stack">
        {FIELDS.map((f) => (
          <section key={f.name} className="card">
            <div className="card-header">
              <div className="card-title-group">
                <h2 className="card-title">{f.label}</h2>
              </div>
            </div>
            <div className="card-body">
              <textarea
                className="input"
                id={f.name}
                name={f.name}
                defaultValue={plan[f.name] ?? ""}
                rows={5}
              />
            </div>
          </section>
        ))}
      </div>

      {state.error && <div className="notice notice--error">{state.error}</div>}
      {state.ok && !state.error && <div className="notice">Plano de aula salvo.</div>}

      <div className="submit-row">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
