"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteQuestion } from "./actions";
import { InlineDeleteConfirm } from "@/components/InlineDeleteConfirm";

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
      <div className="card-body card-body--row">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(id)}
          aria-label="Selecionar esta questão para reaproveitar"
          className="checkbox-lg"
        />
        <div className="flex-fill">
          <div className="exam-meta mb-sm">
            <span className="chip">{TYPE_LABEL[type] ?? type}</span>
            <span className="chip">{DIFFICULTY_LABEL[difficulty] ?? difficulty}</span>
            {tags.map((t) => (
              <span key={t} className="chip">{t}</span>
            ))}
          </div>
          <p className="question-statement question-statement--tight">{statement}</p>
          <div className="popover-row popover-row--start">
            <InlineDeleteConfirm
              confirming={confirming}
              pending={pending}
              onRequestConfirm={() => setConfirming(true)}
              onCancel={() => setConfirming(false)}
              onConfirm={onDelete}
              hint="Excluir esta questão?"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
