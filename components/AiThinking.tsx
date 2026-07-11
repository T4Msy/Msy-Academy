/** Pulsing-dots indicator for AI wait states (generation, search, chat) — makes the wait tangible instead of a static ellipsis (docs/07 §7.7). */
export function AiThinking({ label }: { label?: string }) {
  return (
    <span className="ai-thinking" role="status">
      {label && <span>{label}</span>}
      <span className="ai-thinking-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {!label && <span className="visually-hidden">Gerando…</span>}
    </span>
  );
}
