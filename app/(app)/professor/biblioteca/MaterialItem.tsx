"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMaterialDownloadUrl, deleteMaterial } from "./actions";

const KIND_LABEL: Record<string, string> = {
  EXAM: "Prova",
  ACTIVITY: "Atividade",
  LESSON_PLAN: "Plano de aula",
  FILE: "Arquivo",
};

const KIND_HREF: Record<string, (refId: string) => string> = {
  EXAM: (id) => `/professor/provas/${id}`,
  ACTIVITY: (id) => `/professor/atividades/${id}`,
  LESSON_PLAN: (id) => `/professor/planos-de-aula/${id}`,
};

export function MaterialItem({
  id,
  kind,
  refId,
  storagePath,
  title,
}: {
  id: string;
  kind: string;
  refId: string | null;
  storagePath: string | null;
  title: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  async function onOpenFile() {
    if (!storagePath) return;
    try {
      const url = await getMaterialDownloadUrl(storagePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // Signed URL generation failed — nothing to open.
    }
  }

  function onDelete() {
    startTransition(async () => {
      await deleteMaterial(id);
      router.refresh();
    });
  }

  const href = kind !== "FILE" && refId ? KIND_HREF[kind]?.(refId) : null;

  return (
    <div className="card" style={{ display: "flex" }}>
      <div className="card-body" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        {href ? (
          <Link href={href} style={{ flex: 1, minWidth: 0 }}>
            <span className="chip" style={{ marginRight: 8 }}>{KIND_LABEL[kind] ?? kind}</span>
            <span className="exam-card-title" style={{ display: "inline" }}>{title}</span>
          </Link>
        ) : (
          <button type="button" onClick={onOpenFile} style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", cursor: "pointer" }}>
            <span className="chip" style={{ marginRight: 8 }}>{KIND_LABEL[kind] ?? kind}</span>
            <span className="exam-card-title" style={{ display: "inline" }}>{title}</span>
          </button>
        )}

        {confirming ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => setConfirming(false)}>Cancelar</button>
            <button type="button" className="btn btn-danger-ghost btn-sm" disabled={pending} onClick={onDelete}>
              {pending ? "Excluindo…" : "Confirmar"}
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(true)} style={{ flexShrink: 0 }}>
            Excluir
          </button>
        )}
      </div>
    </div>
  );
}
