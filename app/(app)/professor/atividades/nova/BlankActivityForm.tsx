"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBlankActivity } from "../actions";

export function BlankActivityForm() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!titulo.trim()) {
      setError("Informe um título para a atividade.");
      return;
    }
    startTransition(async () => {
      try {
        const id = await createBlankActivity(titulo);
        router.push(`/professor/atividades/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit} noValidate>
      <section className="card">
        <div className="card-body">
          <div className="form-field">
            <label className="field-label" htmlFor="blank-atividade-titulo">Título</label>
            <input
              className="input"
              id="blank-atividade-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Lista de exercícios — Frações"
            />
          </div>
          <p className="field-hint">Você adiciona as questões manualmente na tela seguinte.</p>
          {error && <div className="notice notice--error">{error}</div>}
          <div className="submit-row">
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Criando…" : "Criar atividade"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
