"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renameExam, duplicateExamVersion, deleteExam } from "../actions";

type Mode = "closed" | "menu" | "rename" | "confirmDelete";

export function ExamHeaderMenu({ examId, examTitle }: { examId: string; examTitle: string }) {
  const [mode, setMode] = useState<Mode>("closed");
  const [title, setTitle] = useState(examTitle);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function close() {
    setMode("closed");
    setError(null);
    setTitle(examTitle);
  }

  function onRename() {
    const clean = title.trim();
    if (!clean || clean === examTitle) return close();
    setError(null);
    startTransition(async () => {
      try {
        await renameExam(examId, clean);
        close();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  function onDuplicate() {
    setError(null);
    startTransition(async () => {
      try {
        const newId = await duplicateExamVersion(examId);
        close();
        router.push(`/professor/provas/${newId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  function onDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteExam(examId);
        close();
        router.push("/professor/provas");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <div className="user-menu">
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        aria-haspopup="menu"
        aria-expanded={mode !== "closed"}
        onClick={() => setMode(mode === "closed" ? "menu" : "closed")}
      >
        Ações
      </button>

      {mode !== "closed" && (
        <>
          <div className="popover-backdrop" onClick={close} />
          <div className="popover-pop" role="menu">
            {mode === "menu" && (
              <>
                <button type="button" className="popover-item" role="menuitem" disabled={pending} onClick={() => setMode("rename")}>
                  Renomear
                </button>
                <button type="button" className="popover-item" role="menuitem" disabled={pending} onClick={onDuplicate}>
                  {pending ? "Gerando versão B…" : "Gerar versão B"}
                </button>
                <button type="button" className="popover-item popover-item--danger" role="menuitem" disabled={pending} onClick={() => setMode("confirmDelete")}>
                  Excluir
                </button>
              </>
            )}

            {mode === "rename" && (
              <div className="popover-form">
                <input
                  className="input"
                  autoFocus
                  value={title}
                  disabled={pending}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onRename();
                    if (e.key === "Escape") close();
                  }}
                />
                <div className="popover-row">
                  <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={close}>Cancelar</button>
                  <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={onRename}>
                    {pending ? "Salvando…" : "Salvar"}
                  </button>
                </div>
              </div>
            )}

            {mode === "confirmDelete" && (
              <div className="popover-form">
                <p className="popover-confirm">Excluir esta prova?</p>
                <div className="popover-row">
                  <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={close}>Cancelar</button>
                  <button type="button" className="btn btn-danger-ghost btn-sm" disabled={pending} onClick={onDelete}>
                    {pending ? "Excluindo…" : "Excluir"}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="popover-error">{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}
