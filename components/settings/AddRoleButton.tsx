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
      <div className="notice">
        Ambiente de {label} ativado.{" "}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => router.push(role === "PROFESSOR" ? "/professor" : "/aluno")}>
          Ir para o ambiente de {label}
        </button>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="role" value={role} />
      {state.error && <div className="notice notice--error">{state.error}</div>}
      <button type="submit" className="btn btn-ghost btn-sm" disabled={pending}>
        {pending ? "Ativando…" : `Ativar ambiente de ${label}`}
      </button>
    </form>
  );
}
