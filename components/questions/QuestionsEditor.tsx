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
  onRegenerate: (questionId: string) => Promise<void>;
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
      try {
        await actions.onRegenerate(question.id);
        setEditing(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
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
    <section className="card question-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="step-badge">Questão {index + 1}</div>
          <span className="chip">{TYPE_LABEL[question.type]}</span>
          <span className="chip">{DIFFICULTY_LABEL[question.difficulty]}</span>
        </div>
        <div className="question-card-actions">
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending || index === 0} onClick={() => onMove("up")} aria-label="Mover para cima">
            ↑
          </button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending || index === total - 1} onClick={() => onMove("down")} aria-label="Mover para baixo">
            ↓
          </button>
          {!editing && !confirmingRemove && (
            <>
              <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={onRegenerate}>
                {pending ? <AiThinking label="Gerando" /> : "Regenerar"}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={startEdit}>
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

      <div className="card-body">
        {editing ? (
          <>
            <div className="form-field">
              <label className="field-label" htmlFor={`statement-${question.id}`}>Enunciado</label>
              <textarea id={`statement-${question.id}`} className="input" value={statement} onChange={(e) => setStatement(e.target.value)} />
            </div>

            {question.type !== "DISCURSIVA" && (
              <fieldset className="form-field fieldset-reset">
                <legend className="field-label legend-reset">Alternativas (marque a correta)</legend>
                <div className="question-options-edit">
                  {options.map((opt, i) => (
                    <label key={opt.id} className="question-option-edit-row">
                      <input
                        type="radio"
                        name={`correct-${question.id}`}
                        checked={correctAnswer === opt.id}
                        onChange={() => setCorrectAnswer(opt.id)}
                        aria-label={`Marcar alternativa ${opt.id} como correta`}
                      />
                      <span className="question-option-id">{opt.id}</span>
                      <input
                        className="input"
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
              <div className="form-field">
                <label className="field-label" htmlFor={`reference-answer-${question.id}`}>Resposta de referência</label>
                <textarea
                  id={`reference-answer-${question.id}`}
                  className="input"
                  value={Array.isArray(correctAnswer) ? correctAnswer.join("\n") : correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                />
              </div>
            )}

            <div className="form-field">
              <label className="field-label" htmlFor={`explanation-${question.id}`}>Explicação (opcional)</label>
              <textarea id={`explanation-${question.id}`} className="input" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
            </div>

            {error && <div className="notice notice--error">{error}</div>}

            <div className="popover-row">
              <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => setEditing(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={onSave}>
                {pending ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="question-statement">{question.statement}</p>

            {question.type !== "DISCURSIVA" && displayOptions.length > 0 && (
              <ul className="question-options-list">
                {displayOptions.map((opt) => (
                  <li
                    key={opt.id}
                    className={`question-option${opt.id === question.correct_answer ? " question-option--correct" : ""}`}
                  >
                    <span className="question-option-id">{opt.id}</span> {opt.text}
                  </li>
                ))}
              </ul>
            )}

            {question.type === "DISCURSIVA" && (
              <p className="question-reference-answer">
                <b>Resposta de referência:</b>{" "}
                {Array.isArray(question.correct_answer) ? question.correct_answer.join(", ") : question.correct_answer}
              </p>
            )}

            {question.explanation && (
              <p className="field-hint">
                <b>Explicação:</b> {question.explanation}
              </p>
            )}

            {error && <div className="notice notice--error">{error}</div>}
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
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
        + Adicionar questão
      </button>
    );
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Nova questão</h2>
      </div>
      <div className="card-body">
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
    <div className="questions-stack">
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
