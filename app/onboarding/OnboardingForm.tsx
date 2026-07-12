"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding, type OnboardingState } from "./actions";

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

const initialState: OnboardingState = {};

export function OnboardingForm({ redirectTo }: { redirectTo?: string }) {
  const [selected, setSelected] = useState<Set<Role>>(new Set());
  const [state, formAction, pending] = useActionState(completeOnboarding, initialState);
  const router = useRouter();

  function toggle(role: Role) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  function onContinue() {
    router.push(redirectTo || (selected.has("PROFESSOR") ? "/professor" : "/aluno"));
  }

  if (state.guardianConsentUrl) {
    return (
      <div className="notice stack-sm">
        <p className="text-strong">Falta um passo: consentimento do responsável</p>
        <p className="field-hint">
          Como você indicou ter menos de 18 anos, um responsável legal precisa confirmar o uso da
          plataforma. Copie o link abaixo e envie para ele — a confirmação leva menos de um minuto,
          sem precisar criar conta.
        </p>
        <div className="exam-meta">
          <input className="input" readOnly value={state.guardianConsentUrl} onFocus={(e) => e.target.select()} />
        </div>
        <button type="button" className="btn btn-primary btn-generate" onClick={onContinue}>
          Continuar
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="stack-md">
      <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />
      {Array.from(selected).map((role) => (
        <input key={role} type="hidden" name="roles" value={role} />
      ))}

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
      <p className="field-hint">
        Pode escolher os dois — você troca de ambiente quando quiser, sem precisar de outra conta.
        Se escolher só um agora, dá para ativar o outro depois em Configurações, e isso é sempre
        gratuito — não depende do seu plano.
      </p>

      {selected.has("ALUNO") && (
        <div className="form-field">
          <label className="field-label" htmlFor="birth_date">
            Data de nascimento (opcional)
          </label>
          <input
            className="input"
            id="birth_date"
            name="birthDate"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
          />
          <p className="field-hint">
            Se você tem menos de 18 anos, pedimos o consentimento de um responsável, conforme a LGPD.
          </p>
        </div>
      )}

      {state.error && <div className="notice notice--error">{state.error}</div>}

      <button type="submit" className="btn btn-primary btn-generate" disabled={selected.size === 0 || pending}>
        {pending ? "Entrando…" : "Continuar"}
      </button>
    </form>
  );
}
