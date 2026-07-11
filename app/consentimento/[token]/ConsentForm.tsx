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
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <div
          aria-hidden="true"
          style={{
            width: 48,
            height: 48,
            margin: "0 auto 12px",
            borderRadius: "50%",
            background: "var(--accent-dim)",
            border: "1px solid var(--accent-border)",
            display: "grid",
            placeItems: "center",
            color: "var(--accent-text)",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="field-hint" style={{ margin: 0 }}>
          Consentimento confirmado. Obrigado — o estudante já pode continuar usando a plataforma.
        </p>
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
