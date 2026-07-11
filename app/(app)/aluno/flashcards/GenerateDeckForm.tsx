"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AiThinking } from "@/components/AiThinking";

export function GenerateDeckForm({ materials }: { materials: { id: string; title: string }[] }) {
  const [materialId, setMaterialId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!materialId) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/ai/flashcards/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materialId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? `Erro ${res.status}`);
        router.push(`/aluno/flashcards/${data.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  if (materials.length === 0) {
    return (
      <div className="notice">
        Nenhum material disponível ainda. Peça ao seu professor para anexar um PDF a uma das suas turmas.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card" style={{ maxWidth: 480 }}>
      <div className="card-body">
        <div className="form-field">
          <label className="field-label" htmlFor="material">Gerar a partir de</label>
          <select className="input" id="material" value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
            <option value="">Selecione um material…</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>
        {error && <div className="notice notice--error">{error}</div>}
        <div className="submit-row" style={{ marginTop: 8 }}>
          <button type="submit" className="btn btn-primary btn-generate" disabled={pending || !materialId}>
            {pending ? <AiThinking label="Gerando" /> : "Gerar deck"}
          </button>
        </div>
      </div>
    </form>
  );
}
