"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ActivityForm() {
  const router = useRouter();
  const [tituloprova, setTitulo] = useState("");
  const [materia, setMateria] = useState("");
  const [assunto, setAssunto] = useState("");
  const [tipo, setTipo] = useState("multipla");
  const [quantidade, setQuantidade] = useState("8");
  const [nivel, setNivel] = useState("medio");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/activities/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tituloprova, materia, assunto, tipo, quantidade, nivel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Erro ${res.status}`);
      router.push(`/professor/atividades/${data.id}`);
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
              <label className="field-label" htmlFor="tituloprova">Título</label>
              <input className="input" id="tituloprova" value={tituloprova} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Lista de exercícios — Frações" />
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="materia">Matéria</label>
              <input className="input" id="materia" value={materia} onChange={(e) => setMateria(e.target.value)} placeholder="Ex: Matemática" />
            </div>
            <div className="form-field form-field--full">
              <label className="field-label" htmlFor="assunto">Assunto</label>
              <input className="input" id="assunto" value={assunto} onChange={(e) => setAssunto(e.target.value)} placeholder="Ex: Frações equivalentes" />
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="tipo">Tipo de questão</label>
              <select className="input" id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="multipla">Múltipla escolha</option>
                <option value="vf">Verdadeiro / Falso</option>
                <option value="discursiva">Discursiva</option>
                <option value="mista">Mista</option>
              </select>
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="quantidade">Quantidade</label>
              <input className="input" id="quantidade" type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="nivel">Nível</label>
              <select className="input" id="nivel" value={nivel} onChange={(e) => setNivel(e.target.value)}>
                <option value="facil">Fácil</option>
                <option value="medio">Médio</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>
          </div>

          {erro && <div className="notice notice--error">{erro}</div>}

          <div className="submit-row" style={{ marginTop: 8 }}>
            <button type="submit" className="btn btn-primary btn-generate" disabled={loading}>
              {loading ? (<><span className="btn-loader" /> Gerando...</>) : "Gerar Atividade"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
