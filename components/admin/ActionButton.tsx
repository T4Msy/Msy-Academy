"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

/** Generic admin action button — calls a pre-bound server action, then refreshes. Errors fall through to app/error.tsx (internal tool, not a customer-facing flow). */
export function ActionButton({
  action,
  label,
  pendingLabel,
  variant = "ghost",
}: {
  action: () => Promise<void>;
  label: string;
  pendingLabel?: string;
  variant?: "ghost" | "danger";
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  const className = `btn btn-sm ${variant === "danger" ? "btn-danger-ghost" : "btn-ghost"}`;

  return (
    <button type="button" className={className} disabled={pending} onClick={onClick}>
      {pending ? (pendingLabel ?? "Só um momento…") : label}
    </button>
  );
}
