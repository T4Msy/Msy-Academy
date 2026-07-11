"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/settings/actions";

export function ProfileSettingsForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const [name, setName] = useState(initialName);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(
    null,
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    startTransition(async () => {
      try {
        await updateProfile(name);
        setNotice({ type: "ok", text: "Perfil atualizado." });
      } catch (err) {
        setNotice({
          type: "error",
          text: err instanceof Error ? err.message : "Algo deu errado.",
        });
      }
    });
  }

  const dirty = name.trim() !== initialName.trim() && name.trim().length > 0;

  return (
    <form className="form-stack" onSubmit={onSubmit}>
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Seu nome"
        />
      </div>

      {notice && (
        <div className={`notice${notice.type === "error" ? " notice--error" : ""}`}>
          {notice.text}
        </div>
      )}

      <div>
        <button type="submit" className="btn btn-primary" disabled={pending || !dirty}>
          {pending ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
