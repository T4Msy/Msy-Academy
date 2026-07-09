export function Logo({ size = 34 }: { size?: number }) {
  const inner = Math.round(size * 0.53);
  return (
    <div className="logo" aria-hidden="true" style={{ width: size, height: size }}>
      <svg fill="none" width={inner} height={inner} viewBox="0 0 24 24">
        <path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          stroke="#06130d"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
        <path
          d="M14 2v6h6"
          stroke="#06130d"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
        <path
          d="M8 13h8M8 17h8M8 9h2"
          stroke="#06130d"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
      </svg>
    </div>
  );
}
