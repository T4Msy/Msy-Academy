"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleStudyItem } from "../actions";

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

export function StudyItemsList({ planId, items }: { planId: string; items: StudyItem[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onToggle(itemId: string, currentlyDone: boolean) {
    startTransition(async () => {
      await toggleStudyItem(itemId, planId, !currentlyDone);
      router.refresh();
    });
  }

  return (
    <div className="questions-stack">
      {items.map((item) => (
        <div key={item.id} className="card">
          <div className="card-body" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <label className="opt-check" style={{ flex: 1 }}>
              <input type="checkbox" checked={item.status === "DONE"} disabled={pending} onChange={() => onToggle(item.id, item.status === "DONE")} />
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
          </div>
        </div>
      ))}
    </div>
  );
}
