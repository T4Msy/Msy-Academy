"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QuestionBankItem } from "./QuestionBankItem";
import { addQuestionsToExam } from "./actions";

interface Question {
  id: string;
  statement: string;
  type: string;
  difficulty: string;
  tags: string[];
}

/** US-2.8 — select bank questions and attach them to an existing exam via exam_questions. */
export function QuestionBankList({ questions, exams }: { questions: Question[]; exams: { id: string; title: string }[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [examId, setExamId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onAdd() {
    setError(null);
    if (!examId) {
      setError("Escolha a prova de destino.");
      return;
    }
    startTransition(async () => {
      try {
        await addQuestionsToExam(examId, Array.from(selected));
        router.push(`/professor/provas/${examId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <>
      <div className={`questions-stack${selected.size > 0 ? " questions-stack--with-toolbar" : ""}`}>
        {questions.map((q) => (
          <QuestionBankItem
            key={q.id}
            id={q.id}
            statement={q.statement}
            type={q.type}
            difficulty={q.difficulty}
            tags={q.tags}
            selected={selected.has(q.id)}
            onToggleSelect={toggle}
          />
        ))}
      </div>

      {selected.size > 0 && (
        <div className="card selection-toolbar">
          <div className="card-body card-body--row-wrap">
            <span className="chip step-badge--accent">
              {selected.size} {selected.size > 1 ? "questões selecionadas" : "questão selecionada"}
            </span>
            {exams.length > 0 ? (
              <>
                <select className="input select-inline" value={examId} onChange={(e) => setExamId(e.target.value)}>
                  <option value="">Escolha a prova de destino…</option>
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>{e.title || "Prova sem título"}</option>
                  ))}
                </select>
                <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={onAdd}>
                  {pending ? "Adicionando…" : "Adicionar à prova"}
                </button>
              </>
            ) : (
              <span className="field-hint mt-0">
                Crie uma prova primeiro para poder adicionar questões a ela.
              </span>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>
              Limpar seleção
            </button>
            {error && <div className="notice notice--error notice--inline">{error}</div>}
          </div>
        </div>
      )}
    </>
  );
}
