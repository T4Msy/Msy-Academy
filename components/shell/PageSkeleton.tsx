/** Route `loading.tsx` fallbacks — shapes built from the real .card/.exam-card
 * classes so the skeleton roughly matches the loaded page (no layout jump). */

export function PageHeadSkeleton({ withAction }: { withAction?: boolean } = {}) {
  return (
    <div className="page-head">
      <div style={{ width: "100%", maxWidth: 320 }}>
        <div className="skeleton-shimmer skeleton-line--title" style={{ marginBottom: 10 }} />
        <div className="skeleton-shimmer skeleton-line" style={{ width: "80%" }} />
      </div>
      {withAction && <div className="skeleton-shimmer skeleton-block" style={{ width: 140, height: 38 }} />}
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="exam-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="exam-card">
          <div className="skeleton-shimmer skeleton-line--title" />
          <div style={{ display: "flex", gap: 6 }}>
            <div className="skeleton-shimmer skeleton-pill" />
            <div className="skeleton-shimmer skeleton-pill" />
          </div>
          <div className="skeleton-shimmer skeleton-line" style={{ width: "70%", marginTop: "auto" }} />
        </div>
      ))}
    </div>
  );
}

export function CardListSkeleton({ count = 4, rows = 2 }: { count?: number; rows?: number }) {
  return (
    <div className="questions-stack">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <div className="card-header">
            <div className="skeleton-shimmer skeleton-line--title" style={{ width: 200 }} />
          </div>
          <div className="card-body">
            {Array.from({ length: rows }).map((_, r) => (
              <div key={r} className="skeleton-shimmer skeleton-line" style={{ width: `${90 - r * 12}%` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="quick-actions-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card">
          <div className="card-body">
            <div className="skeleton-shimmer skeleton-line" style={{ width: "60%", marginBottom: 12 }} />
            <div className="skeleton-shimmer skeleton-block" style={{ height: 32, width: "40%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
