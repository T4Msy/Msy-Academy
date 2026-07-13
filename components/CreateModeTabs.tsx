"use client";

import { useState } from "react";

/**
 * Escolha real entre gerar com IA ou criar do zero — reaproveita o visual de
 * "ia-tile"/"ia-grid" que antes era um seletor de provedor de IA decorativo
 * (removido em ExamForm.tsx); agora vira uma escolha que muda o formulário
 * de fato. Compartilhado por Provas, Atividades e Planos de Aula.
 */
export function CreateModeTabs({
  aiForm,
  blankForm,
  aiLabel = "Gerar com IA",
  aiDesc,
  blankLabel = "Criar do zero",
  blankDesc,
}: {
  aiForm: React.ReactNode;
  blankForm: React.ReactNode;
  aiLabel?: string;
  aiDesc?: string;
  blankLabel?: string;
  blankDesc?: string;
}) {
  const [mode, setMode] = useState<"ai" | "blank">("ai");

  return (
    <>
      <div className="ia-grid mb-md" role="radiogroup" aria-label="Modo de criação">
        <button
          type="button"
          className={`ia-tile${mode === "ai" ? " active" : ""}`}
          role="radio"
          aria-checked={mode === "ai"}
          onClick={() => setMode("ai")}
        >
          <div className="mb-1.5 flex items-center gap-[9px]">
            <div className="grid size-[15px] shrink-0 place-items-center rounded-full border-[1.5px] border-subtle transition-colors" aria-hidden="true" />
            <span className="font-display text-[13.5px] font-bold text-foreground">{aiLabel}</span>
          </div>
          {aiDesc && <p className="text-xs leading-snug text-muted-foreground">{aiDesc}</p>}
        </button>
        <button
          type="button"
          className={`ia-tile${mode === "blank" ? " active" : ""}`}
          role="radio"
          aria-checked={mode === "blank"}
          onClick={() => setMode("blank")}
        >
          <div className="mb-1.5 flex items-center gap-[9px]">
            <div className="grid size-[15px] shrink-0 place-items-center rounded-full border-[1.5px] border-subtle transition-colors" aria-hidden="true" />
            <span className="font-display text-[13.5px] font-bold text-foreground">{blankLabel}</span>
          </div>
          {blankDesc && <p className="text-xs leading-snug text-muted-foreground">{blankDesc}</p>}
        </button>
      </div>
      {mode === "ai" ? aiForm : blankForm}
    </>
  );
}
