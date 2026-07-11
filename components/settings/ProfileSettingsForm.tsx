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
    <form className="form-stack" action={formAction}>
      <div className="form-field">
        <label className="field-label" htmlFor="email">
          E-mail
        </label>
        <input className="input" id="email" value={email} disabled />
        <p className="field-hint">O e-mail é usado para entrar na sua conta.</p>
      </div>

      <div className="form-field">
        <label className="field-label" htmlFor="full_name">
          Nome completo
        </label>
        <input
          className="input"
          id="full_name"
          name="full_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Seu nome"
        />
      </div>

      {state.error && <div className="notice notice--error">{state.error}</div>}
      {state.ok && !state.error && <div className="notice">Perfil atualizado.</div>}

      <div>
        <button type="submit" className="btn btn-primary" disabled={pending || !dirty}>
          {pending ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
