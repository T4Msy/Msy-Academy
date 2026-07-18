"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleStudyItem, createStudyItem, updateStudyItem, deleteStudyItem } from "../actions";
import { StudyItemForm, type StudyItemInput } from "./StudyItemForm";
import { InlineDeleteConfirm } from "@/components/InlineDeleteConfirm";
import { EmptyState } from "@/components/EmptyState";

const TYPE_LABEL: Record<string, string> = { REVISAO: "Revisão", EXERCICIO: "Exercício", LEITURA: "Leitura" };

export interface StudyItem {
  id: string;
  item_date: string;
  topic: string;
  item_type: string;
  status: "PENDING" | "DONE";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}

function StudyItemRow({ planId, item }: { planId: string; item: StudyItem }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function onToggle() {
    startTransition(async () => {
      try {
        await toggleStudyItem(item.id, planId, item.status !== "DONE");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não conseguimos atualizar este tópico. Tente novamente.");
      }
    });
  }

  function onDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteStudyItem(item.id, planId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não conseguimos excluir este tópico. Tente novamente.");
      }
    });
  }

  if (editing) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
        <div className="flex flex-col gap-4.5 p-5.5">
          <StudyItemForm
            initial={{ item_date: item.item_date, topic: item.topic, item_type: item.item_type as StudyItemInput["item_type"] }}
            submitLabel="Salvar"
            onCancel={() => setEditing(false)}
            onSubmit={async (input) => {
              await updateStudyItem(item.id, planId, input);
              setEditing(false);
              router.refresh();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
      <div className="flex flex-row flex-wrap items-center justify-between gap-3 p-5.5">
        <label className="opt-check opt-check--fill">
          <input type="checkbox" checked={item.status === "DONE"} disabled={pending} onChange={onToggle} />
          <span className="opt-box" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="opt-text">
            <b className={item.status === "DONE" ? "done-text" : undefined}>{item.topic}</b>
            <span>{formatDate(item.item_date)} · {TYPE_LABEL[item.item_type] ?? item.item_type}</span>
          </span>
        </label>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" disabled={pending} onClick={() => setEditing(true)}>
            Editar
          </button>
          <InlineDeleteConfirm
            confirming={confirming}
            pending={pending}
            onRequestConfirm={() => setConfirming(true)}
            onCancel={() => setConfirming(false)}
            onConfirm={onDelete}
            hint="Excluir este item?"
          />
        </div>
      </div>
      {error && <div className="rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text mx-4 mt-0 mb-4">{error}</div>}
    </div>
  );
}

function AddItemPanel({ planId }: { planId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!open) {
    return (
      <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-4 py-2.5" onClick={() => setOpen(true)}>
        + Adicionar item
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
        <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Novo item</h2>
      </div>
      <div className="flex flex-col gap-4.5 p-5.5">
        <StudyItemForm
          submitLabel="Adicionar"
          onCancel={() => setOpen(false)}
          onSubmit={async (input) => {
            await createStudyItem(planId, input);
            setOpen(false);
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}

export function StudyItemsList({ planId, items }: { planId: string; items: StudyItem[] }) {
  return (
    <div className="flex flex-col gap-3.5">
      {items.length === 0 ? (
        <EmptyState variant="plano" title="Sem itens" text="Adicione o primeiro item manualmente." />
      ) : (
        items.map((item) => <StudyItemRow key={item.id} planId={planId} item={item} />)
      )}
      <AddItemPanel planId={planId} />
    </div>
  );
}
