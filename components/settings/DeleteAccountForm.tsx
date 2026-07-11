"use client";

import { useState, useTransition } from "react";
import { deleteMyAccount } from "@/lib/settings/actions";

/** Danger-zone self-service account deletion (LGPD). Requires typing "EXCLUIR" to arm the button — no bare confirm() dialog, so the intent is explicit and undoable up to the click. */
export function DeleteAccountForm() {
  const [confirmation, setConfirmation] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const armed = confirmation.trim().toUpperCase() === "EXCLUIR";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await deleteMyAccount(confirmation);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <form className="form-stack" onSubmit={onSubmit}>
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
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          autoComplete="off"
          placeholder="EXCLUIR"
        />
      </div>
      {error && <div className="notice notice--error">{error}</div>}
      <div>
        <button type="submit" className="btn btn-danger-ghost" disabled={!armed || pending}>
          {pending ? "Excluindo…" : "Excluir minha conta"}
        </button>
      </div>
    </form>
  );
}
