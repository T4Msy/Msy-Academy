"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AiThinking } from "@/components/AiThinking";

export function StudyPlanWizard() {
  const [goal, setGoal] = useState("");
  const [examDate, setExamDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/ai/study-plan/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal, examDate: examDate || null }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? `Erro ${res.status}`);
        router.push(`/aluno/plano-de-estudos/${data.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card" style={{ maxWidth: 480 }}>
      <div className="card-body">
        <div className="form-field">
          <label className="field-label" htmlFor="goal">Objetivo</label>
          <input className="input" id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Ex: Passar no vestibular de Medicina" required />
        </div>
        <div className="form-field">
          <label className="field-label" htmlFor="examDate">Data da prova (opcional)</label>
          <input className="input" id="examDate" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </div>
        {error && <div className="notice notice--error">{error}</div>}
        <div className="submit-row" style={{ marginTop: 8 }}>
          <button type="submit" className="btn btn-primary btn-generate" disabled={pending || !goal.trim()}>
            {pending ? <AiThinking label="Gerando" /> : "Gerar cronograma"}
          </button>
        </div>
      </div>
    </form>
  );
}
