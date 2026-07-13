"use client";

import { useState } from "react";
import { deleteMyAccount } from "@/lib/settings/actions";

/**
 * Danger-zone self-service account deletion (LGPD). Requires typing "EXCLUIR"
 * to arm the button. Submits as a native form action (not an imperative
 * `await deleteMyAccount()` in a try/catch) — the action's own redirect()
 * calls must reach Next.js's form-action redirect handling directly; a
 * client-side try/catch around an imperative call would instead catch the
 * redirect as an error. See the comment on deleteMyAccount for the full
 * reasoning.
 */
export function DeleteAccountForm({ returnPath, error }: { returnPath: string; error?: string }) {
  const [confirmation, setConfirmation] = useState("");
  const armed = confirmation.trim().toUpperCase() === "EXCLUIR";

  return (
    <form className="flex flex-col gap-3.5" action={deleteMyAccount.bind(null, returnPath)}>
      <p className="mt-0 text-xs leading-snug text-muted-foreground">
        Isso exclui permanentemente sua conta e todo o conteúdo associado a ela (provas, turmas,
        atividades, submissões, planos de estudo, flashcards e conversas com o tutor). Não é
        possível desfazer.
      </p>
      <div className="flex flex-col gap-1.5">
        <label className="block text-sm font-semibold text-foreground" htmlFor="delete-confirm">
          Digite <b>EXCLUIR</b> para confirmar
        </label>
        <input
          className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
          id="delete-confirm"
          name="confirmation"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          autoComplete="off"
          placeholder="EXCLUIR"
        />
      </div>
      {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}
      <div>
        <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-danger-border bg-danger-dim text-danger-text hover:bg-danger/15 px-4 py-2.5" disabled={!armed}>
          Excluir minha conta
        </button>
      </div>
    </form>
  );
}
