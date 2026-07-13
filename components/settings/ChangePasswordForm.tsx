"use client";

import { useActionState } from "react";
import { changePassword, type ChangePasswordState } from "@/lib/settings/actions";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);

  return (
    <form className="flex flex-col gap-3.5" action={formAction}>
      <div className="flex flex-col gap-1.5">
        <label className="block text-sm font-semibold text-foreground" htmlFor="current_password">Senha atual</label>
        <input className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="current_password" name="current_password" type="password" required autoComplete="current-password" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="block text-sm font-semibold text-foreground" htmlFor="new_password">Nova senha</label>
        <input className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="new_password" name="new_password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="block text-sm font-semibold text-foreground" htmlFor="confirm_password">Confirmar nova senha</label>
        <input className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="confirm_password" name="confirm_password" type="password" required minLength={8} autoComplete="new-password" />
      </div>

      {state.error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{state.error}</div>}
      {state.ok && !state.error && <div className="mt-3.5 rounded-md border border-brand-border bg-brand-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-brand-text">Senha alterada com sucesso.</div>}

      <div>
        <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-3 py-[7px] text-sm" disabled={pending}>
          {pending ? "Salvando…" : "Trocar senha"}
        </button>
      </div>
    </form>
  );
}
