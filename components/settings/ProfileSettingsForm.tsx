"use client";

import { useActionState, useState } from "react";
import { updateProfile, type UpdateProfileState } from "@/lib/settings/actions";

const initialState: UpdateProfileState = {};

export function ProfileSettingsForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const [name, setName] = useState(initialName);
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  const dirty = name.trim() !== initialName.trim() && name.trim().length > 0;

  return (
    <form className="flex flex-col gap-3.5" action={formAction}>
      <div className="flex flex-col gap-1.5">
        <label className="block text-sm font-semibold text-foreground" htmlFor="email">
          E-mail
        </label>
        <input className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="email" value={email} disabled />
        <p className="mt-1 text-xs leading-snug text-muted-foreground">O e-mail é usado para entrar na sua conta.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="block text-sm font-semibold text-foreground" htmlFor="full_name">
          Nome completo
        </label>
        <input
          className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
          id="full_name"
          name="full_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Seu nome"
        />
      </div>

      {state.error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{state.error}</div>}
      {state.ok && !state.error && <div className="mt-3.5 rounded-md border border-brand-border bg-brand-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-brand-text">Perfil atualizado.</div>}

      <div>
        <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-4 py-2.5" disabled={pending || !dirty}>
          {pending ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
