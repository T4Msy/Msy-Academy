"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardianConsentUrl, setGuardianConsentUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

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
        const result = await completeOnboarding(Array.from(selected), birthDate || null, redirectTo);
        if (result?.guardianConsentUrl) {
          setGuardianConsentUrl(result.guardianConsentUrl);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  function onContinue() {
    router.push(redirectTo || (selected.has("PROFESSOR") ? "/professor" : "/aluno"));
  }

  if (guardianConsentUrl) {
    return (
      <div className="notice" style={{ marginTop: 8 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>Falta um passo: consentimento do responsável</p>
        <p className="field-hint" style={{ marginTop: 8 }}>
          Como você indicou ter menos de 18 anos, um responsável legal precisa confirmar o uso da
          plataforma. Copie o link abaixo e envie para ele — a confirmação leva menos de um minuto,
          sem precisar criar conta.
        </p>
        <div className="exam-meta" style={{ marginTop: 10 }}>
          <input className="input" readOnly value={guardianConsentUrl} onFocus={(e) => e.target.select()} />
        </div>
        <button
          type="button"
          className="btn btn-primary btn-generate"
          style={{ marginTop: 16 }}
          onClick={onContinue}
        >
          Continuar
        </button>
      </div>
    );
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

      {selected.has("ALUNO") && (
        <div className="form-field" style={{ marginTop: 16 }}>
          <label className="field-label" htmlFor="birth_date">
            Data de nascimento (opcional)
          </label>
          <input
            className="input"
            id="birth_date"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
          />
          <p className="field-hint">
            Se você tem menos de 18 anos, pedimos o consentimento de um responsável, conforme a LGPD.
          </p>
        </div>
      )}

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
