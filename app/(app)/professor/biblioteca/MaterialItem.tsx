"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMaterialDownloadUrl, deleteMaterial } from "./actions";
import { InlineDeleteConfirm } from "@/components/InlineDeleteConfirm";

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
    <div className="card card--flex">
      <div className="card-body card-body--row-between">
        {href ? (
          <Link href={href} className="flex-fill">
            <span className="chip mr-sm">{KIND_LABEL[kind] ?? kind}</span>
            <span className="exam-card-title exam-card-title--inline">{title}</span>
          </Link>
        ) : (
          <button type="button" onClick={onOpenFile} className="btn-reset-fill">
            <span className="chip mr-sm">{KIND_LABEL[kind] ?? kind}</span>
            <span className="exam-card-title exam-card-title--inline">{title}</span>
          </button>
        )}

        <div className="item-actions">
          <InlineDeleteConfirm
            confirming={confirming}
            pending={pending}
            onRequestConfirm={() => setConfirming(true)}
            onCancel={() => setConfirming(false)}
            onConfirm={onDelete}
          />
        </div>
      </div>
    </div>
  );
}
