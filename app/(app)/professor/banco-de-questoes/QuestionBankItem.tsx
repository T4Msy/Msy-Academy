"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteQuestion } from "./actions";

const DIFFICULTY_LABEL: Record<string, string> = { FACIL: "Fácil", MEDIO: "Médio", DIFICIL: "Difícil" };
const TYPE_LABEL: Record<string, string> = { MULTIPLA: "Múltipla escolha", VF: "Verdadeiro/Falso", DISCURSIVA: "Discursiva" };

export function QuestionBankItem({
  id,
  statement,
  type,
  difficulty,
  tags,
  selected,
  onToggleSelect,
}: {
  id: string;
  statement: string;
  type: string;
  difficulty: string;
  tags: string[];
  selected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onDelete() {
    startTransition(async () => {
      await deleteQuestion(id);
      router.refresh();
    });
  }

  return (
    <div className={`card question-bank-item${selected ? " question-bank-item--selected" : ""}`}>
      <div className="card-body" style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(id)}
          aria-label="Selecionar esta questão para reaproveitar"
          style={{ accentColor: "var(--accent)", width: 18, height: 18, marginTop: 3, flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="exam-meta" style={{ marginBottom: 8 }}>
            <span className="chip">{TYPE_LABEL[type] ?? type}</span>
            <span className="chip">{DIFFICULTY_LABEL[difficulty] ?? difficulty}</span>
            {tags.map((t) => (
              <span key={t} className="chip">{t}</span>
            ))}
          </div>
          <p className="question-statement" style={{ marginBottom: 8 }}>{statement}</p>
          <div className="popover-row" style={{ justifyContent: "flex-start" }}>
            {confirming ? (
              <>
                <span className="field-hint" style={{ marginTop: 0 }}>Excluir esta questão?</span>
                <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => setConfirming(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-danger-ghost btn-sm" disabled={pending} onClick={onDelete}>
                  {pending ? "Excluindo…" : "Confirmar"}
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(true)}>
                Excluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
