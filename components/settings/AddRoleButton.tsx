"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { addRoleToCurrentUser, type AddRoleState, type Role } from "@/lib/settings/roles-actions";

const initialState: AddRoleState = {};

export function AddRoleButton({ role, label }: { role: Role; label: string }) {
  const [state, formAction, pending] = useActionState(addRoleToCurrentUser, initialState);
  const router = useRouter();

  if (state.ok) {
    return (
      <div className="mt-3.5 rounded-md border border-brand-border bg-brand-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-brand-text">
        Ambiente de {label} ativado.{" "}
        <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" onClick={() => router.push(role === "PROFESSOR" ? "/professor" : "/aluno")}>
          Ir para o ambiente de {label}
        </button>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="role" value={role} />
      {state.error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{state.error}</div>}
      <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" disabled={pending}>
        {pending ? "Ativando…" : `Ativar ambiente de ${label}`}
      </button>
    </form>
  );
}
