"use client";

/** Cancelar/Confirmar pair shared by list-row delete flows (QuestionBankItem, MaterialItem). */
export function InlineDeleteConfirm({
  confirming,
  pending,
  onRequestConfirm,
  onCancel,
  onConfirm,
  confirmLabel = "Confirmar",
  hint,
}: {
  confirming: boolean;
  pending: boolean;
  onRequestConfirm: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  hint?: string;
}) {
  if (!confirming) {
    return (
      <button type="button" className="btn btn-ghost btn-sm" onClick={onRequestConfirm}>
        Excluir
      </button>
    );
  }

  return (
    <>
      {hint && <span className="field-hint mt-0">{hint}</span>}
      <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={onCancel}>
        Cancelar
      </button>
      <button type="button" className="btn btn-danger-ghost btn-sm" disabled={pending} onClick={onConfirm}>
        {pending ? "Excluindo…" : confirmLabel}
      </button>
    </>
  );
}
