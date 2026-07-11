"use client";

import { useState, useTransition } from "react";
import { completeOnboarding } from "./actions";

type Role = "PROFESSOR" | "ALUNO";

const ROLES: { value: Role; title: string; desc: string }[] = [
  {
    value: "PROFESSOR",
    title: "Sou professor",
    desc: "Crio provas, atividades e planos de aula; gerencio turmas e corrijo entregas.",
  },
  {
    value: "ALUNO",
    title: "Sou aluno",
    desc: "Resolvo tarefas da minha turma, tiro dúvidas com o tutor de IA e faço simulados.",
  },
];

export function OnboardingForm({ redirectTo }: { redirectTo?: string }) {
  const [selected, setSelected] = useState<Set<Role>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(role: Role) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await completeOnboarding(Array.from(selected), redirectTo);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="ia-grid" role="group" aria-label="Escolha seu papel">
        {ROLES.map((r) => (
          <button
            type="button"
            key={r.value}
            className={`ia-tile${selected.has(r.value) ? " active" : ""}`}
            aria-pressed={selected.has(r.value)}
            onClick={() => toggle(r.value)}
          >
            <div className="ia-tile-header">
              <div className="radio-dot" aria-hidden="true" />
              <span className="ia-name">{r.title}</span>
            </div>
            <p className="ia-desc">{r.desc}</p>
          </button>
        ))}
      </div>
      <p className="field-hint" style={{ marginTop: 14 }}>
        Pode escolher os dois — você troca de ambiente quando quiser, sem precisar de outra conta.
      </p>

      {error && <div className="notice notice--error">{error}</div>}

      <button
        type="submit"
        className="btn btn-primary btn-generate"
        disabled={selected.size === 0 || pending}
        style={{ marginTop: 20 }}
      >
        {pending ? "Entrando…" : "Continuar"}
      </button>
    </form>
  );
}
