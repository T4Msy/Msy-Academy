"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Mode = "menu" | "rename" | "confirmDelete";

interface ExtraAction {
  label: string;
  pendingLabel: string;
  onRun: () => Promise<void>;
}

/** Shared rename+soft-delete popover for content types (activities, lesson
 *  plans, exams). Migrado para as primitivas do DS (Radix Popover + Button/
 *  Input): foco gerenciado, Esc fecha, sem backdrop hand-rolled. */
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
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const [title, setTitle] = useState(currentTitle);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setMode("menu");
      setError(null);
      setTitle(currentTitle);
    }
  }

  function close() {
    handleOpenChange(false);
  }

  function runExtraAction(action: ExtraAction) {
    setError(null);
    startTransition(async () => {
      try {
        await action.onRun();
        close();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não conseguimos renomear este item. Tente novamente.");
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
        setError(err instanceof Error ? err.message : "Não conseguimos duplicar este item. Tente novamente.");
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
        setError(err instanceof Error ? err.message : "Não conseguimos excluir este item. Tente novamente.");
      }
    });
  }

  const itemClass =
    "w-full rounded-sm px-2.5 py-2 text-left text-md text-foreground outline-none transition-colors hover:bg-accent focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-50";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button type="button" className="btn btn-ghost btn-sm" aria-haspopup="menu">
          Ações
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-1.5">
        {mode === "menu" && (
          <div className="flex flex-col" role="menu">
            <button type="button" className={itemClass} role="menuitem" disabled={pending} onClick={() => setMode("rename")}>
              Renomear
            </button>
            {extraActions?.map((action) => (
              <button
                key={action.label}
                type="button"
                className={itemClass}
                role="menuitem"
                disabled={pending}
                onClick={() => runExtraAction(action)}
              >
                {pending ? action.pendingLabel : action.label}
              </button>
            ))}
            <button
              type="button"
              className={`${itemClass} text-danger-text hover:bg-danger-dim focus-visible:bg-danger-dim`}
              role="menuitem"
              disabled={pending}
              onClick={() => setMode("confirmDelete")}
            >
              Excluir
            </button>
          </div>
        )}

        {mode === "rename" && (
          <div className="flex flex-col gap-2 p-1">
            <Input
              autoFocus
              value={title}
              disabled={pending}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") close();
              }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" disabled={pending} onClick={close}>
                Cancelar
              </Button>
              <Button size="sm" disabled={pending} onClick={handleRename}>
                {pending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </div>
        )}

        {mode === "confirmDelete" && (
          <div className="flex flex-col gap-2 p-1">
            <p className="text-md text-foreground">{deleteConfirmLabel}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" disabled={pending} onClick={close}>
                Cancelar
              </Button>
              <Button variant="destructive-ghost" size="sm" disabled={pending} onClick={handleDelete}>
                {pending ? "Excluindo…" : "Excluir"}
              </Button>
            </div>
          </div>
        )}

        {error && <p className="px-1 pt-1.5 text-xs text-danger-text">{error}</p>}
      </PopoverContent>
    </Popover>
  );
}
