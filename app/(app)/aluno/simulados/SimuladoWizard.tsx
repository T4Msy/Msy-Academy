"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSimulado } from "./actions";

export function SimuladoWizard({ subjects }: { subjects: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [quantidade, setQuantidade] = useState("5");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const mode = subjectId ? "MATERIA" : difficulty ? "DIFICULDADE" : "PERSONALIZADO";
        const id = await createSimulado({
          title: `Simulado ${new Date().toLocaleDateString("pt-BR")}`,
          mode,
          quantidade: Number(quantidade) || 5,
          subjectId: subjectId || null,
          difficulty: (difficulty || null) as "FACIL" | "MEDIO" | "DIFICIL" | null,
        });
        router.push(`/aluno/simulados/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        Gerar simulado
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-420">
      <div className="card-body card-body--form">
        <div className="form-field">
          <label className="field-label" htmlFor="subject">Matéria (opcional)</label>
          <select className="input" id="subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Todas</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="field-label" htmlFor="difficulty">Dificuldade (opcional)</label>
          <select className="input" id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="">Todas</option>
            <option value="FACIL">Fácil</option>
            <option value="MEDIO">Médio</option>
            <option value="DIFICIL">Difícil</option>
          </select>
        </div>
        <div className="form-field">
          <label className="field-label" htmlFor="quantidade">Quantidade de questões</label>
          <input className="input" id="quantidade" type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
        </div>
        <p className="field-hint mt-0">
          As questões vêm das provas e atividades já atribuídas a você.
        </p>
        {error && <div className="notice notice--error">{error}</div>}
        <div className="popover-row">
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => setOpen(false)}>Cancelar</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
            {pending ? "Gerando…" : "Gerar"}
          </button>
        </div>
      </div>
    </form>
  );
}
