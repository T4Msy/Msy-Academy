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
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors sticky bottom-4 z-10 mt-4 shadow-[0_8px_26px_rgba(0,0,0,0.28)]">
          <div className="flex flex-row flex-wrap items-center gap-3 p-5.5">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs border-brand-border bg-brand-dim text-brand-text">
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
                <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-3 py-[7px] text-sm" disabled={pending} onClick={onAdd}>
                  {pending ? "Adicionando…" : "Adicionar à prova"}
                </button>
              </>
            ) : (
              <span className="mt-0 text-xs leading-snug text-muted-foreground">
                Crie uma prova primeiro para poder adicionar questões a ela.
              </span>
            )}
            <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" onClick={() => setSelected(new Set())}>
              Limpar seleção
            </button>
            {error && <div className="rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text m-0 basis-full">{error}</div>}
          </div>
        </div>
      )}
    </>
  );
}
