"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteQuestion } from "./actions";
import { InlineDeleteConfirm } from "@/components/InlineDeleteConfirm";
import type { QuestionOrigin } from "@/lib/questions/queries";

const DIFFICULTY_LABEL: Record<string, string> = { FACIL: "Fácil", MEDIO: "Médio", DIFICIL: "Difícil" };
const TYPE_LABEL: Record<string, string> = { MULTIPLA: "Múltipla escolha", VF: "Verdadeiro/Falso", DISCURSIVA: "Discursiva" };

export function QuestionBankItem({
  id,
  statement,
  type,
  difficulty,
  tags,
  bnccCodes,
  createdAt,
  authorName,
  origins,
  selected,
  onToggleSelect,
}: {
  id: string;
  statement: string;
  type: string;
  difficulty: string;
  tags: string[];
  bnccCodes: string[];
  createdAt: string;
  authorName: string | null;
  origins: QuestionOrigin[];
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

  const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value)) : null;

  return (
    <div className={`overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors ${selected ? "border-brand-border bg-brand-dim" : ""}`}>
      <div className="flex flex-row items-start gap-3 p-5.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(id)}
          aria-label="Selecionar esta questão para reaproveitar"
          className="mt-[3px] size-4.5 shrink-0 accent-brand"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-2 mt-0.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{TYPE_LABEL[type] ?? type}</span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{DIFFICULTY_LABEL[difficulty] ?? difficulty}</span>
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{t}</span>
            ))}
            {tags.length > 3 && <span className="text-xs text-muted-foreground">+{tags.length - 3}</span>}
            {bnccCodes.length > 0 && <span className="text-xs text-muted-foreground">BNCC: {bnccCodes.join(", ")}</span>}
          </div>
          <p className="mb-2 text-[14.5px] leading-relaxed text-foreground">{statement}</p>
          <section className="mb-3 rounded-md border border-border bg-[rgba(var(--overlay-rgb),0.025)] px-3 py-2.5" aria-label="Origem da questão">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Origem</p>
            {origins.length > 0 ? (
              <div className="flex flex-col gap-2">
                {origins.map((origin, index) => (
                  <div key={`${origin.sourceType}-${origin.sourceTitle}-${origin.className ?? "sem-turma"}-${index}`} className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">{origin.sourceType}: {origin.sourceTitle}</span>
                    <span className="ml-1">· {[
                      formatDate(origin.date) ? `Data: ${formatDate(origin.date)}` : null,
                      origin.className ? `Turma: ${origin.className}` : null,
                      origin.teacherName ? `Professor: ${origin.teacherName}` : null,
                      origin.subject ? `Matéria: ${origin.subject}` : null,
                      origin.content ? `Conteúdo: ${origin.content}` : null,
                    ].filter(Boolean).join(" · ")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">Criada diretamente no banco{authorName ? ` por ${authorName}` : ""} em {formatDate(createdAt)}.</p>
            )}
          </section>
          <div className="flex flex-wrap justify-start gap-2">
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
