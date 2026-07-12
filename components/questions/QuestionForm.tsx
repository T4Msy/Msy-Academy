"use client";

import { useState, useTransition } from "react";
import type { QuestionType, Difficulty, NewQuestionInput } from "@/lib/questions/types";

const TYPE_LABEL: Record<QuestionType, string> = {
  MULTIPLA: "Múltipla escolha",
  VF: "Verdadeiro/Falso",
  DISCURSIVA: "Discursiva",
};

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  FACIL: "Fácil",
  MEDIO: "Médio",
  DIFICIL: "Difícil",
};

function defaultOptions(type: QuestionType): { id: string; text: string }[] {
  if (type === "VF") return [{ id: "V", text: "Verdadeiro" }, { id: "F", text: "Falso" }];
  if (type === "MULTIPLA") {
    return [
      { id: "A", text: "" },
      { id: "B", text: "" },
      { id: "C", text: "" },
      { id: "D", text: "" },
    ];
  }
  return [];
}

/**
 * Formulário manual de questão — criação do zero (Banco de Questões,
 * botão "Adicionar questão" em Provas/Atividades). Diferente do bloco
 * `editing` do QuestionCard (que assume tipo fixo de uma questão já
 * existente), aqui o tipo é escolhido primeiro e as alternativas mudam de
 * acordo (V/F fixo, múltipla escolha com 4 alternativas em branco).
 */
export function QuestionForm({
  onSubmit,
  onCancel,
  submitLabel = "Adicionar questão",
}: {
  onSubmit: (input: NewQuestionInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [type, setType] = useState<QuestionType>("MULTIPLA");
  const [statement, setStatement] = useState("");
  const [options, setOptions] = useState(defaultOptions("MULTIPLA"));
  const [correctAnswer, setCorrectAnswer] = useState<string | string[]>("A");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIO");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleTypeChange(next: QuestionType) {
    setType(next);
    const opts = defaultOptions(next);
    setOptions(opts);
    setCorrectAnswer(next === "DISCURSIVA" ? "" : (opts[0]?.id ?? ""));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!statement.trim()) {
      setError("Preencha o enunciado.");
      return;
    }
    startTransition(async () => {
      try {
        await onSubmit({
          type,
          statement: statement.trim(),
          options: type === "DISCURSIVA" ? null : options,
          correctAnswer,
          explanation: explanation || null,
          difficulty,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <div className="form-grid-2">
        <div className="form-field">
          <label className="field-label" htmlFor="qf-type">Tipo</label>
          <select
            className="input"
            id="qf-type"
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
          >
            {(Object.keys(TYPE_LABEL) as QuestionType[]).map((t) => (
              <option key={t} value={t}>{TYPE_LABEL[t]}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="field-label" htmlFor="qf-difficulty">Dificuldade</label>
          <select
            className="input"
            id="qf-difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          >
            {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => (
              <option key={d} value={d}>{DIFFICULTY_LABEL[d]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-field">
        <label className="field-label" htmlFor="qf-statement">Enunciado</label>
        <textarea id="qf-statement" className="input" value={statement} onChange={(e) => setStatement(e.target.value)} />
      </div>

      {type !== "DISCURSIVA" && (
        <fieldset className="form-field fieldset-reset">
          <legend className="field-label legend-reset">Alternativas (marque a correta)</legend>
          <div className="question-options-edit">
            {options.map((opt, i) => (
              <label key={opt.id} className="question-option-edit-row">
                <input
                  type="radio"
                  name="qf-correct"
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
                  disabled={type === "VF"}
                />
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {type === "DISCURSIVA" && (
        <div className="form-field">
          <label className="field-label" htmlFor="qf-reference">Resposta de referência</label>
          <textarea
            id="qf-reference"
            className="input"
            value={Array.isArray(correctAnswer) ? correctAnswer.join("\n") : correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
          />
        </div>
      )}

      <div className="form-field">
        <label className="field-label" htmlFor="qf-explanation">Explicação (opcional)</label>
        <textarea id="qf-explanation" className="input" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
      </div>

      {error && <div className="notice notice--error">{error}</div>}

      <div className="popover-row">
        {onCancel && (
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
