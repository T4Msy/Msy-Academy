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
    <div className="cat-bar-list">
      {items.map((item, i) => (
        <div key={`${i}-${item.label}`}>
          <div className="cat-bar-row-head">
            <span className="cat-bar-label">{item.label}</span>
            <span className="tabular-nums-muted">
              {item.value}{item.suffix ?? ""}
            </span>
          </div>
          <div className="usage-bar">
            <div
              className="usage-bar-fill"
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%`, background: `var(--cat-${item.catSlot})` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
