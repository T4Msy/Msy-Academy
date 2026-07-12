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
        setError(err instanceof Error ? err.message : "Algo deu errado.");
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
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  if (editing) {
    return (
      <div className="card">
        <div className="card-body">
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
    <div className="card">
      <div className="card-body" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <label className="opt-check" style={{ flex: 1, minWidth: 200 }}>
          <input type="checkbox" checked={item.status === "DONE"} disabled={pending} onChange={onToggle} />
          <span className="opt-box" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="opt-text">
            <b style={{ textDecoration: item.status === "DONE" ? "line-through" : "none" }}>{item.topic}</b>
            <span>{formatDate(item.item_date)} · {TYPE_LABEL[item.item_type] ?? item.item_type}</span>
          </span>
        </label>
        <div className="popover-row">
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => setEditing(true)}>
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
      {error && <div className="notice notice--error" style={{ margin: "0 16px 16px" }}>{error}</div>}
    </div>
  );
}

function AddItemPanel({ planId }: { planId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
        + Adicionar item
      </button>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Novo item</h2>
      </div>
      <div className="card-body">
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
    <div className="questions-stack">
      {items.length === 0 ? (
        <EmptyState variant="plano" title="Sem itens" text="Adicione o primeiro item manualmente." />
      ) : (
        items.map((item) => <StudyItemRow key={item.id} planId={planId} item={item} />)
      )}
      <AddItemPanel planId={planId} />
    </div>
  );
}
