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
      <div className="ia-grid" role="radiogroup" aria-label="Modo de criação" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className={`ia-tile${mode === "ai" ? " active" : ""}`}
          role="radio"
          aria-checked={mode === "ai"}
          onClick={() => setMode("ai")}
        >
          <div className="ia-tile-header">
            <div className="radio-dot" aria-hidden="true" />
            <span className="ia-name">{aiLabel}</span>
          </div>
          {aiDesc && <p className="ia-desc">{aiDesc}</p>}
        </button>
        <button
          type="button"
          className={`ia-tile${mode === "blank" ? " active" : ""}`}
          role="radio"
          aria-checked={mode === "blank"}
          onClick={() => setMode("blank")}
        >
          <div className="ia-tile-header">
            <div className="radio-dot" aria-hidden="true" />
            <span className="ia-name">{blankLabel}</span>
          </div>
          {blankDesc && <p className="ia-desc">{blankDesc}</p>}
        </button>
      </div>
      {mode === "ai" ? aiForm : blankForm}
    </>
  );
}
