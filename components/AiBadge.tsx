/** RNF-C05 — transparency label for AI-generated content, shown next to titles/meta rows. */
export function AiBadge({ label = "Gerado por IA" }: { label?: string }) {
  return (
    <span className="step-badge step-badge--accent" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </span>
  );
}
