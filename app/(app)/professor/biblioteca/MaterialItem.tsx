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
    <div className="flex overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
      <div className="flex flex-row items-center justify-between gap-3 p-5.5">
        {href ? (
          <Link href={href} className="min-w-0 flex-1">
            <span className="mr-2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{KIND_LABEL[kind] ?? kind}</span>
            <span className="inline font-display text-base font-bold tracking-[-0.2px] text-foreground">{title}</span>
          </Link>
        ) : (
          <button type="button" onClick={onOpenFile} className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-left [color:inherit] [font:inherit]">
            <span className="mr-2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{KIND_LABEL[kind] ?? kind}</span>
            <span className="inline font-display text-base font-bold tracking-[-0.2px] text-foreground">{title}</span>
          </button>
        )}

        <div className="flex shrink-0 items-center gap-2">
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
