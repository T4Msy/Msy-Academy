"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AiThinking } from "@/components/AiThinking";

export function LessonPlanForm() {
  const router = useRouter();
  const [disciplina, setDisciplina] = useState("");
  const [serie, setSerie] = useState("");
  const [tema, setTema] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/lesson-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disciplina, serie, tema, observacoes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Erro ${res.status}`);
      router.push(`/professor/planos-de-aula/${data.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit} noValidate>
      <section className="card">
        <div className="card-body">
          <div className="form-grid-2">
            <div className="form-field">
              <label className="field-label" htmlFor="disciplina">Disciplina</label>
              <input className="input" id="disciplina" value={disciplina} onChange={(e) => setDisciplina(e.target.value)} placeholder="Ex: História" />
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="serie">Série</label>
              <input className="input" id="serie" value={serie} onChange={(e) => setSerie(e.target.value)} placeholder="Ex: 8º ano" />
            </div>
            <div className="form-field form-field--full">
              <label className="field-label" htmlFor="tema">Tema da aula</label>
              <input className="input" id="tema" value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex: Revolução Industrial" required />
            </div>
            <div className="form-field form-field--full">
              <label className="field-label" htmlFor="observacoes">Observações (opcional)</label>
              <textarea className="input" id="observacoes" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Ex: turma com pouco tempo disponível, priorizar atividade prática..." />
            </div>
          </div>

          {erro && <div className="notice notice--error">{erro}</div>}

          <div className="submit-row">
            <button type="submit" className="btn btn-primary btn-generate" disabled={loading || !tema.trim()}>
              {loading ? <AiThinking label="Gerando" /> : "Gerar Plano de Aula"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
