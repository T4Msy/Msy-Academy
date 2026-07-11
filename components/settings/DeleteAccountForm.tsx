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
    <form className="form-stack" action={deleteMyAccount.bind(null, returnPath)}>
      <p className="field-hint" style={{ marginTop: 0 }}>
        Isso exclui permanentemente sua conta e todo o conteúdo associado a ela (provas, turmas,
        atividades, submissões, planos de estudo, flashcards e conversas com o tutor). Não é
        possível desfazer.
      </p>
      <div className="form-field">
        <label className="field-label" htmlFor="delete-confirm">
          Digite <b>EXCLUIR</b> para confirmar
        </label>
        <input
          className="input"
          id="delete-confirm"
          name="confirmation"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          autoComplete="off"
          placeholder="EXCLUIR"
        />
      </div>
      {error && <div className="notice notice--error">{error}</div>}
      <div>
        <button type="submit" className="btn btn-danger-ghost" disabled={!armed}>
          Excluir minha conta
        </button>
      </div>
    </form>
  );
}
