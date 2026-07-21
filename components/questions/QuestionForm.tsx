"use client";

import { useState, useTransition } from "react";
import type { QuestionType, Difficulty, NewQuestionInput } from "@/lib/questions/types";
import { QuestionMetadataFields } from "./QuestionMetadataFields";

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
  const [tags, setTags] = useState<string[]>([]);
  const [bnccCodes, setBnccCodes] = useState<string[]>([]);
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
          tags,
          bnccCodes,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não conseguimos salvar a questão. Tente novamente.");
      }
    });
  }

  return (
    <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-3.5 min-[861px]:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="block text-sm font-semibold text-foreground" htmlFor="qf-type">Tipo</label>
          <select
            className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
            id="qf-type"
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
          >
            {(Object.keys(TYPE_LABEL) as QuestionType[]).map((t) => (
              <option key={t} value={t}>{TYPE_LABEL[t]}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="block text-sm font-semibold text-foreground" htmlFor="qf-difficulty">Dificuldade</label>
          <select
            className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
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

      <div className="flex flex-col gap-1.5">
        <label className="block text-sm font-semibold text-foreground" htmlFor="qf-statement">Enunciado</label>
        <textarea id="qf-statement" className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" value={statement} onChange={(e) => setStatement(e.target.value)} />
      </div>

      <QuestionMetadataFields tags={tags} bnccCodes={bnccCodes} onTagsChange={setTags} onBnccCodesChange={setBnccCodes} />

      {type !== "DISCURSIVA" && (
        <fieldset className="form-field fieldset-reset">
          <legend className="field-label legend-reset">Alternativas (marque a correta)</legend>
          <div className="flex flex-col gap-2">
            {options.map((opt, i) => (
              <label key={opt.id} className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="qf-correct"
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
                  disabled={type === "VF"}
                />
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {type === "DISCURSIVA" && (
        <div className="flex flex-col gap-1.5">
          <label className="block text-sm font-semibold text-foreground" htmlFor="qf-reference">Resposta de referência</label>
          <textarea
            id="qf-reference"
            className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
            value={Array.isArray(correctAnswer) ? correctAnswer.join("\n") : correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="block text-sm font-semibold text-foreground" htmlFor="qf-explanation">Explicação (opcional)</label>
        <textarea id="qf-explanation" className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
      </div>

      {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" disabled={pending} onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-3 py-[7px] text-sm" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
