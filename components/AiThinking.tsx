/** Pulsing-dots indicator for AI wait states (generation, search, chat) —
 *  primitiva de IA do DS (decisão nº 15 do ADR 13). Respeita
 *  prefers-reduced-motion via motion-reduce. */
export function AiThinking({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-inherit" role="status">
      {label && <span>{label}</span>}
      <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1 animate-ai-pulse rounded-full bg-current opacity-35 motion-reduce:animate-none"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      {!label && <span className="visually-hidden">Gerando…</span>}
    </span>
  );
}
