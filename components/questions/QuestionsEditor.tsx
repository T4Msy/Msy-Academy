"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateQuestion } from "@/lib/questions/actions";
import type { QuestionData, NewQuestionInput } from "@/lib/questions/types";
import { AiThinking } from "@/components/AiThinking";
import { EmptyState } from "@/components/EmptyState";
import { InlineDeleteConfirm } from "@/components/InlineDeleteConfirm";
import { QuestionForm } from "./QuestionForm";

const DIFFICULTY_LABEL: Record<QuestionData["difficulty"], string> = {
  FACIL: "Fácil",
  MEDIO: "Médio",
  DIFICIL: "Difícil",
};

const TYPE_LABEL: Record<QuestionData["type"], string> = {
  MULTIPLA: "Múltipla escolha",
  VF: "Verdadeiro/Falso",
  DISCURSIVA: "Discursiva",
};

/**
 * Ações parametrizadas pelo parent (prova ou atividade) — o componente que
 * monta `QuestionsEditor` já faz `.bind(null, parentId)` nas server actions
 * (mesmo padrão de RenameDeleteMenu), então aqui só se lida com questionId.
 */
export interface QuestionsEditorActions {
  onAdd: (input: NewQuestionInput) => Promise<void>;
  onRemove: (questionId: string) => Promise<void>;
  onMove: (questionId: string, direction: "up" | "down") => Promise<void>;
  onRegenerate: (questionId: string) => Promise<{ error?: string }>;
}

/** Fisher-Yates — display-only shuffle for "Versão B" exams (RF-P08); never mutates stored data. */
function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function QuestionCard({
  question,
  index,
  total,
  actions,
  shuffleOptions,
}: {
  question: QuestionData;
  index: number;
  total: number;
  actions: QuestionsEditorActions;
  shuffleOptions: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [statement, setStatement] = useState(question.statement);
  const [options, setOptions] = useState(question.options ?? []);
  const [correctAnswer, setCorrectAnswer] = useState(question.correct_answer);
  const [explanation, setExplanation] = useState(question.explanation ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const displayOptions = shuffleOptions && options.length > 0 ? shuffled(options) : options;

  function startEdit() {
    setStatement(question.statement);
    setOptions(question.options ?? []);
    setCorrectAnswer(question.correct_answer);
    setExplanation(question.explanation ?? "");
    setError(null);
    setEditing(true);
  }

  function onSave() {
    setError(null);
    startTransition(async () => {
      try {
        await updateQuestion(question.id, {
          statement,
          options: options.length > 0 ? options : null,
          correctAnswer,
          explanation: explanation || null,
        });
        setEditing(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  function onRegenerate() {
    setError(null);
    startTransition(async () => {
      const result = await actions.onRegenerate(question.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function onMove(direction: "up" | "down") {
    setError(null);
    startTransition(async () => {
      try {
        await actions.onMove(question.id, direction);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  function onRemove() {
    setError(null);
    startTransition(async () => {
      try {
        await actions.onRemove(question.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2 py-[3px] font-display text-2xs font-bold tracking-[0.5px] uppercase text-muted-foreground">Questão {index + 1}</div>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{TYPE_LABEL[question.type]}</span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{DIFFICULTY_LABEL[question.difficulty]}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" disabled={pending || index === 0} onClick={() => onMove("up")} aria-label="Mover para cima">
            ↑
          </button>
          <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" disabled={pending || index === total - 1} onClick={() => onMove("down")} aria-label="Mover para baixo">
            ↓
          </button>
          {!editing && !confirmingRemove && (
            <>
              <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" disabled={pending} onClick={onRegenerate}>
                {pending ? <AiThinking label="Gerando" /> : "Regenerar"}
              </button>
              <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" disabled={pending} onClick={startEdit}>
                Editar
              </button>
            </>
          )}
          {!editing && (
            <InlineDeleteConfirm
              confirming={confirmingRemove}
              pending={pending}
              onRequestConfirm={() => setConfirmingRemove(true)}
              onCancel={() => setConfirmingRemove(false)}
              onConfirm={onRemove}
              confirmLabel="Remover"
              hint="Remover esta questão?"
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4.5 p-5.5">
        {editing ? (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-semibold text-foreground" htmlFor={`statement-${question.id}`}>Enunciado</label>
              <textarea id={`statement-${question.id}`} className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" value={statement} onChange={(e) => setStatement(e.target.value)} />
            </div>

            {question.type !== "DISCURSIVA" && (
              <fieldset className="form-field fieldset-reset">
                <legend className="field-label legend-reset">Alternativas (marque a correta)</legend>
                <div className="flex flex-col gap-2">
                  {options.map((opt, i) => (
                    <label key={opt.id} className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name={`correct-${question.id}`}
                        checked={correctAnswer === opt.id}
                        onChange={() => setCorrectAnswer(opt.id)}
                        aria-label={`Marcar alternativa ${opt.id} como correta`}
                      />
                      <span className="shrink-0 font-display font-bold text-brand-text">{opt.id}</span>
                      <input
                        className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
                        value={opt.text}
                        onChange={(e) => {
                          const next = [...options];
                          next[i] = { ...opt, text: e.target.value };
                          setOptions(next);
                        }}
                        aria-label={`Texto da alternativa ${opt.id}`}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {question.type === "DISCURSIVA" && (
              <div className="flex flex-col gap-1.5">
                <label className="block text-sm font-semibold text-foreground" htmlFor={`reference-answer-${question.id}`}>Resposta de referência</label>
                <textarea
                  id={`reference-answer-${question.id}`}
                  className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
                  value={Array.isArray(correctAnswer) ? correctAnswer.join("\n") : correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-semibold text-foreground" htmlFor={`explanation-${question.id}`}>Explicação (opcional)</label>
              <textarea id={`explanation-${question.id}`} className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
            </div>

            {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}

            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" disabled={pending} onClick={() => setEditing(false)}>
                Cancelar
              </button>
              <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-3 py-[7px] text-sm" disabled={pending} onClick={onSave}>
                {pending ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-3.5 text-[14.5px] leading-relaxed text-foreground">{question.statement}</p>

            {question.type !== "DISCURSIVA" && displayOptions.length > 0 && (
              <ul className="flex list-none flex-col gap-2">
                {displayOptions.map((opt) => (
                  <li
                    key={opt.id}
                    className={`flex items-baseline gap-2 rounded-sm border px-3 py-[9px] text-[13.5px] ${opt.id === question.correct_answer ? "border-brand-border bg-brand-dim text-foreground" : "border-border text-muted-foreground"}`}
                  >
                    <span className="shrink-0 font-display font-bold text-brand-text">{opt.id}</span> {opt.text}
                  </li>
                ))}
              </ul>
            )}

            {question.type === "DISCURSIVA" && (
              <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                <b>Resposta de referência:</b>{" "}
                {Array.isArray(question.correct_answer) ? question.correct_answer.join(", ") : question.correct_answer}
              </p>
            )}

            {question.explanation && (
              <p className="mt-1 text-xs leading-snug text-muted-foreground">
                <b>Explicação:</b> {question.explanation}
              </p>
            )}

            {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}
          </>
        )}
      </div>
    </section>
  );
}

function AddQuestionPanel({ onAdd }: { onAdd: (input: NewQuestionInput) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!open) {
    return (
      <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-4 py-2.5" onClick={() => setOpen(true)}>
        + Adicionar questão
      </button>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
        <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Nova questão</h2>
      </div>
      <div className="flex flex-col gap-4.5 p-5.5">
        <QuestionForm
          submitLabel="Adicionar"
          onCancel={() => setOpen(false)}
          onSubmit={async (input) => {
            await onAdd(input);
            setOpen(false);
            router.refresh();
          }}
        />
      </div>
    </section>
  );
}

export function QuestionsEditor({
  questions,
  actions,
  shuffleOptions = false,
}: {
  kind: "EXAM" | "ACTIVITY";
  parentId: string;
  questions: QuestionData[];
  actions: QuestionsEditorActions;
  shuffleOptions?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      {questions.length === 0 ? (
        <EmptyState variant="questoes" title="Sem questões" text="Adicione a primeira questão manualmente ou gere com IA." />
      ) : (
        questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            total={questions.length}
            actions={actions}
            shuffleOptions={shuffleOptions}
          />
        ))
      )}
      <AddQuestionPanel onAdd={actions.onAdd} />
    </div>
  );
}
