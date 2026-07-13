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
        <p className="font-semibold">Falta um passo: consentimento do responsável</p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">
          Como você indicou ter menos de 18 anos, um responsável legal precisa confirmar o uso da
          plataforma. Copie o link abaixo e envie para ele — a confirmação leva menos de um minuto,
          sem precisar criar conta.
        </p>
        <div className="mt-0.5 flex flex-wrap gap-1.5">
          <input className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" readOnly value={state.guardianConsentUrl} onFocus={(e) => e.target.select()} />
        </div>
        <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 h-11.5 min-w-40 rounded-full px-5 font-display text-base tracking-[-0.2px]" onClick={onContinue}>
          Continuar
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />
      {Array.from(selected).map((role) => (
        <input key={role} type="hidden" name="roles" value={role} />
      ))}

      <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5" role="group" aria-label="Escolha seu papel">
        {ROLES.map((r) => (
          <button
            type="button"
            key={r.value}
            className={`ia-tile${selected.has(r.value) ? " active" : ""}`}
            aria-pressed={selected.has(r.value)}
            onClick={() => toggle(r.value)}
          >
            <div className="mb-1.5 flex items-center gap-[9px]">
              <div className="grid size-[15px] shrink-0 place-items-center rounded-full border-[1.5px] border-subtle transition-colors" aria-hidden="true" />
              <span className="font-display text-[13.5px] font-bold text-foreground">{r.title}</span>
            </div>
            <p className="text-xs leading-snug text-muted-foreground">{r.desc}</p>
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs leading-snug text-muted-foreground">
        Pode escolher os dois — você troca de ambiente quando quiser, sem precisar de outra conta.
        Se escolher só um agora, dá para ativar o outro depois em Configurações, e isso é sempre
        gratuito — não depende do seu plano.
      </p>

      {selected.has("ALUNO") && (
        <div className="flex flex-col gap-1.5">
          <label className="block text-sm font-semibold text-foreground" htmlFor="birth_date">
            Data de nascimento (opcional)
          </label>
          <input
            className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
            id="birth_date"
            name="birthDate"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
          />
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            Se você tem menos de 18 anos, pedimos o consentimento de um responsável, conforme a LGPD.
          </p>
        </div>
      )}

      {state.error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{state.error}</div>}

      <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 h-11.5 min-w-40 rounded-full px-5 font-display text-base tracking-[-0.2px]" disabled={selected.size === 0 || pending}>
        {pending ? "Entrando…" : "Continuar"}
      </button>
    </form>
  );
}
