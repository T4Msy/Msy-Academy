"use client";

import { useActionState } from "react";
import { changePassword, type ChangePasswordState } from "@/lib/settings/actions";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);

  return (
    <form className="form-stack" action={formAction}>
      <div className="form-field">
        <label className="field-label" htmlFor="current_password">Senha atual</label>
        <input className="input" id="current_password" name="current_password" type="password" required autoComplete="current-password" />
      </div>
      <div className="form-field">
        <label className="field-label" htmlFor="new_password">Nova senha</label>
        <input className="input" id="new_password" name="new_password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div className="form-field">
        <label className="field-label" htmlFor="confirm_password">Confirmar nova senha</label>
        <input className="input" id="confirm_password" name="confirm_password" type="password" required minLength={8} autoComplete="new-password" />
      </div>

      {state.error && <div className="notice notice--error">{state.error}</div>}
      {state.ok && !state.error && <div className="notice">Senha alterada com sucesso.</div>}

      <div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Salvando…" : "Trocar senha"}
        </button>
      </div>
    </form>
  );
}
