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
    <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={onClick}>
      {pending ? "Removendo…" : "Remover"}
    </button>
  );
}
