/**
 * Horizontal bars for a small categorical breakdown (nominal — swapping row
 * order wouldn't change meaning). Thin marks, rounded data-ends, direct
 * value labels always on (the categorical palette's light-mode contrast
 * WARN on a few slots is mitigated by never relying on color alone here).
 */
export function CategoricalBar({
  items,
}: {
  items: { label: string; value: number; catSlot: number; suffix?: string }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((item) => (
        <div key={item.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: "var(--fg)" }}>{item.label}</span>
            <span style={{ color: "var(--fg-muted)", fontVariantNumeric: "tabular-nums" }}>
              {item.value}{item.suffix ?? ""}
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "var(--bg-hover)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.max(4, (item.value / max) * 100)}%`,
                borderRadius: 999,
                background: `var(--cat-${item.catSlot})`,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
