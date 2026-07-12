/** "Peak" mark — an abstract M in progress-peaks, doubling as a growth/mastery motif. Single stroke, legible at favicon size (see app/icon.svg, kept in sync). */
export function Logo({ size = 34 }: { size?: number }) {
  const inner = Math.round(size * 0.56);
  return (
    <div className="logo" aria-hidden="true" style={{ width: size, height: size }}>
      <svg fill="none" width={inner} height={inner} viewBox="0 0 24 24">
        <path
          d="M4 18.5 9 7 12.5 14 16 7 21 18.5"
          stroke="#1a0d08"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.3"
        />
      </svg>
    </div>
  );
}
