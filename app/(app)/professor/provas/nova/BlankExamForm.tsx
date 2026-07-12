"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBlankExam } from "../actions";

export function BlankExamForm() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [curso, setCurso] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!titulo.trim()) {
      setError("Informe um título para a prova.");
      return;
    }
    startTransition(async () => {
      try {
        const id = await createBlankExam(titulo, curso);
        router.push(`/professor/provas/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit} noValidate>
      <section className="card">
        <div className="card-body">
          <div className="form-grid-2">
            <div className="form-field">
              <label className="field-label" htmlFor="blank-titulo">Título da Prova</label>
              <input className="input" id="blank-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Avaliação Bimestral" />
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="blank-curso">Curso</label>
              <input className="input" id="blank-curso" value={curso} onChange={(e) => setCurso(e.target.value)} placeholder="Ex: Ensino Médio, Graduação..." />
            </div>
          </div>
          <p className="field-hint">Você adiciona as questões manualmente na tela seguinte.</p>
          {error && <div className="notice notice--error">{error}</div>}
          <div className="submit-row" style={{ marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Criando…" : "Criar prova"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
