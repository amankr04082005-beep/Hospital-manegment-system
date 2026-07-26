import './LoadingSkeleton.css';

/**
 * SkeletonLoader — shimmer-based loading placeholder.
 * Use while data is being fetched to reduce perceived latency.
 *
 * Example:
 *   <SkeletonLoader rows={3} />
 *   <SkeletonLoader.Card />
 *   <SkeletonLoader.Table columns={4} rows={5} />
 */

export default function SkeletonLoader({ variant = 'text', rows = 1, width, height }) {
  if (variant === 'card') return <SkeletonCard />;
  if (variant === 'table') return <SkeletonTable columns={width || 4} rows={rows || 5} />;

  return (
    <div className="skeleton-group" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton skeleton--text shimmer"
          style={{ width: width || (i === rows - 1 ? '60%' : '100%'), height: height || 14 }}
        />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="skeleton-card shimmer">
      <div className="skeleton skeleton--heading shimmer" style={{ width: '40%', height: 20, marginBottom: 16 }} />
      <div className="skeleton skeleton--text shimmer" style={{ width: '100%', height: 14, marginBottom: 8 }} />
      <div className="skeleton skeleton--text shimmer" style={{ width: '80%', height: 14, marginBottom: 8 }} />
      <div className="skeleton skeleton--text shimmer" style={{ width: '55%', height: 14 }} />
    </div>
  );
}

function SkeletonTable({ columns, rows }) {
  return (
    <div className="skeleton-table">
      {/* header */}
      <div className="skeleton-table__row shimmer">
        {Array.from({ length: columns }).map((_, ci) => (
          <div key={ci} className="skeleton skeleton--heading shimmer" style={{ height: 16 }} />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="skeleton-table__row shimmer">
          {Array.from({ length: columns }).map((_, ci) => (
            <div
              key={ci}
              className="skeleton skeleton--text shimmer"
              style={{ height: 13, width: ci === 0 ? '60%' : '80%' }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export { SkeletonCard, SkeletonTable };

