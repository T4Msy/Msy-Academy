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
      <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" onClick={onRequestConfirm}>
        Excluir
      </button>
    );
  }

  return (
    <>
      {hint && <span className="mt-0 text-xs leading-snug text-muted-foreground">{hint}</span>}
      <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" disabled={pending} onClick={onCancel}>
        Cancelar
      </button>
      <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-danger-border bg-danger-dim text-danger-text hover:bg-danger/15 px-3 py-[7px] text-sm" disabled={pending} onClick={onConfirm}>
        {pending ? "Excluindo…" : confirmLabel}
      </button>
    </>
  );
}
