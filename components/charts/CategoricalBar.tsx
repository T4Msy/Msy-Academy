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
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={`${i}-${item.label}`}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-foreground">{item.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {item.value}{item.suffix ?? ""}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[rgba(var(--overlay-rgb),0.06)]">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-[320ms]"
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%`, background: `var(--cat-${item.catSlot})` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
