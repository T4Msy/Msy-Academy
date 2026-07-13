import { Sparkles } from "lucide-react";

/** RNF-C05 — transparency label for AI-generated content, shown next to
 *  titles/meta rows. Primitiva de IA do DS (decisão nº 15 do ADR 13). */
export function AiBadge({ label = "Gerado por IA" }: { label?: string }) {
  return (
    <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full bg-brand-dim px-2 py-0.5 text-2xs font-semibold text-brand-text">
      <Sparkles size={11} aria-hidden />
      {label}
    </span>
  );
}
