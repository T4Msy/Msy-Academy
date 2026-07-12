"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Mode = "closed" | "menu" | "rename" | "confirmDelete";

interface ExtraAction {
  label: string;
  pendingLabel: string;
  onRun: () => Promise<void>;
}

/** Shared rename+soft-delete popover for content types (activities, lesson plans, exams). */
export function RenameDeleteMenu({
  currentTitle,
  onRename,
  onDelete,
  redirectAfterDelete,
  extraActions,
  deleteConfirmLabel = "Excluir?",
}: {
  currentTitle: string;
  onRename: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
  redirectAfterDelete: string;
  extraActions?: ExtraAction[];
  deleteConfirmLabel?: string;
}) {
  const [mode, setMode] = useState<Mode>("closed");
  const [title, setTitle] = useState(currentTitle);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function close() {
    setMode("closed");
    setError(null);
    setTitle(currentTitle);
  }

  function runExtraAction(action: ExtraAction) {
    setError(null);
    startTransition(async () => {
      try {
        await action.onRun();
        close();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  function handleRename() {
    const clean = title.trim();
    if (!clean || clean === currentTitle) return close();
    setError(null);
    startTransition(async () => {
      try {
        await onRename(clean);
        close();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await onDelete();
        close();
        router.push(redirectAfterDelete);
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
                {extraActions?.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className="popover-item"
                    role="menuitem"
                    disabled={pending}
                    onClick={() => runExtraAction(action)}
                  >
                    {pending ? action.pendingLabel : action.label}
                  </button>
                ))}
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
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") close();
                  }}
                />
                <div className="popover-row">
                  <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={close}>Cancelar</button>
                  <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={handleRename}>
                    {pending ? "Salvando…" : "Salvar"}
                  </button>
                </div>
              </div>
            )}

            {mode === "confirmDelete" && (
              <div className="popover-form">
                <p className="popover-confirm">{deleteConfirmLabel}</p>
                <div className="popover-row">
                  <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={close}>Cancelar</button>
                  <button type="button" className="btn btn-danger-ghost btn-sm" disabled={pending} onClick={handleDelete}>
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
