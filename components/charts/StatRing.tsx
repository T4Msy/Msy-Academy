/**
 * Progress ring for a single proportion (0-100). Per the dataviz skill: a
 * lone magnitude doesn't need a legend or categorical color — the number is
 * the direct label, so there's no color-alone identity problem here.
 */
export function StatRing({
  value,
  label,
  size = 88,
  strokeWidth = 8,
}: {
  value: number | null;
  label: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - pct / 100);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", flexShrink: 0 }} role="img" aria-label={`${label}: ${value === null ? "sem dados" : `${value}%`}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {value !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        )}
      </svg>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, color: "var(--fg)", lineHeight: 1 }}>
          {value === null ? "—" : `${value}%`}
        </div>
        <div className="field-hint" style={{ marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}
