"use client";

import { useState, useTransition } from "react";
import { confirmGuardianConsent } from "./actions";

export function ConsentForm({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await confirmGuardianConsent(token, name);
        setDone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  if (done) {
    return (
      <div className="notice" style={{ marginTop: 16 }}>
        Consentimento confirmado. Obrigado — o estudante já pode continuar usando a plataforma.
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="form-field">
        <label className="field-label" htmlFor="guardian_name">
          Seu nome (responsável legal)
        </label>
        <input
          className="input"
          id="guardian_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome completo"
          autoComplete="name"
          required
        />
      </div>
      {error && <div className="notice notice--error">{error}</div>}
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Confirmando…" : "Confirmar consentimento"}
      </button>
    </form>
  );
}
