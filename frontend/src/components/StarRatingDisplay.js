import { Star } from 'lucide-react';

function StarSlot({ index, rating }) {
  const r = Math.min(5, Math.max(0, rating));
  const filled = r >= index;
  const half = !filled && r >= index - 0.5;

  if (half) {
    return (
      <span className="relative h-4 w-4 shrink-0">
        <Star className="absolute inset-0 h-4 w-4 text-slate-200" strokeWidth={1.5} aria-hidden />
        <span className="absolute inset-0 w-1/2 overflow-hidden">
          <Star className="h-4 w-4 fill-amber-400 text-amber-500" strokeWidth={1.5} aria-hidden />
        </span>
      </span>
    );
  }

  return (
    <Star
      className={`h-4 w-4 shrink-0 ${filled ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}`}
      strokeWidth={1.5}
      aria-hidden
    />
  );
}

/**
 * Read-only 5-star row with numeric average (e.g. 4.5) and optional review count.
 */
export default function StarRatingDisplay({ rating, reviewCount, className = '' }) {
  const raw = rating != null && rating !== '' ? Number(rating) : null;
  const valid = raw != null && !Number.isNaN(raw);
  const displayR = valid ? Math.min(5, Math.max(0, raw)) : 0;
  const count = reviewCount ?? 0;

  const label = valid
    ? `${displayR % 1 === 0 ? Math.round(displayR) : displayR.toFixed(1)} out of 5 stars${count > 0 ? `, ${count} reviews` : ''}`
    : count > 0
      ? `${count} reviews`
      : 'No rating yet';

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()} role="img" aria-label={label}>
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <StarSlot key={i} index={i} rating={displayR} />
        ))}
      </span>
      {valid ? (
        <span className="text-xs font-semibold text-slate-700 tabular-nums">
          {displayR % 1 === 0 ? Math.round(displayR) : displayR.toFixed(1)}
        </span>
      ) : (
        <span className="text-xs font-medium text-slate-400">—</span>
      )}
      {count > 0 && <span className="text-xs text-slate-500 tabular-nums">({count})</span>}
    </div>
  );
}
