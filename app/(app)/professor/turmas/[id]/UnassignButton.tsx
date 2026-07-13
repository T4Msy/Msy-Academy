"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { unassignContent } from "../actions";

export function UnassignButton({ classId, assignmentId }: { classId: string; assignmentId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    startTransition(async () => {
      await unassignContent(classId, assignmentId);
      router.refresh();
    });
  }

  return (
    <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" disabled={pending} onClick={onClick}>
      {pending ? "Removendo…" : "Remover"}
    </button>
  );
}
