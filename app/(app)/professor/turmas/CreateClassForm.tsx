"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClass } from "./actions";

export function CreateClassForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const id = await createClass(name);
        setOpen(false);
        setName("");
        router.push(`/professor/turmas/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        <svg fill="none" width="16" height="16" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Nova Turma
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card" style={{ maxWidth: 380 }}>
      <div className="card-body" style={{ gap: 10 }}>
        <div className="form-field">
          <label className="field-label" htmlFor="class-name">Nome da turma</label>
          <input
            className="input"
            id="class-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: 3º Ano B — Biologia"
          />
        </div>
        {error && <div className="notice notice--error">{error}</div>}
        <div className="popover-row">
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => setOpen(false)}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending || !name.trim()}>
            {pending ? "Criando…" : "Criar turma"}
          </button>
        </div>
      </div>
    </form>
  );
}
