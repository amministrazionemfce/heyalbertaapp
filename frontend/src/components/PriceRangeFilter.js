/**
 * Dual-thumb range slider — navy active segment, light track, white circular handles.
 * Fixed scale $0 … PRICE_SLIDER_MAX.
 * Interaction: **top half** of the bar adjusts **max**, **bottom half** adjusts **min** (avoids overlapping invisible inputs fighting for drags).
 */
export const PRICE_SLIDER_MAX = 50000;

export default function PriceRangeFilter({
  min,
  max,
  rangeMax = PRICE_SLIDER_MAX,
  onChange,
  disabled,
  hideValueSummary = false,
}) {
  const cap = Math.max(100, Number(rangeMax) || PRICE_SLIDER_MAX);

  const pct = (v) => (v / cap) * 100;

  const setMin = (v) => {
    const n = Math.min(Math.max(0, Math.round(Number(v))), cap);
    if (n <= max) onChange({ min: n, max });
    else onChange({ min: max, max: n });
  };

  const setMax = (v) => {
    const n = Math.min(Math.max(0, Math.round(Number(v))), cap);
    if (n >= min) onChange({ min, max: n });
    else onChange({ min: n, max: min });
  };

  const leftPct = pct(min);
  const widthPct = Math.max(0, pct(max) - leftPct);

  const rangeClass =
    'absolute left-0 w-full opacity-0 cursor-ew-resize z-20 h-1/2 disabled:cursor-not-allowed';

  return (
    <div className={`space-y-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div
        className="relative h-14 w-full select-none px-0.5"
        role="group"
        aria-label="Price range slider. Use upper half for maximum, lower half for minimum."
      >
        {/* Track + fill — never block pointer events */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-slate-200/95 shadow-inner z-10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-1/2 h-3 -translate-y-1/2 rounded-full bg-[#1e3a8a] shadow-sm transition-[left,width] duration-75 z-10"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
          aria-hidden
        />

        {/* Thumbs — visual only; inputs sit above in z-order for hit testing */}
        <div
          className="pointer-events-none absolute top-1/2 w-4 h-4 -translate-y-1/2 rounded-full bg-white border border-slate-200/80 shadow-md z-[15] transition-[left] duration-75"
          style={{ left: `calc(${leftPct}% - 8px)` }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-1/2 w-4 h-4 -translate-y-1/2 rounded-full bg-white border border-slate-200/80 shadow-md z-[15] transition-[left] duration-75"
          style={{ left: `calc(${leftPct + widthPct}% - 8px)` }}
          aria-hidden
        />

        {/* Top half: control MAX only */}
        <input
          type="range"
          min={0}
          max={cap}
          step={50}
          value={Math.min(max, cap)}
          onChange={(e) => setMax(e.target.value)}
          disabled={disabled}
          className={`${rangeClass} top-0`}
          aria-label="Maximum price — drag in the upper half of the bar"
        />
        {/* Bottom half: control MIN only */}
        <input
          type="range"
          min={0}
          max={cap}
          step={50}
          value={Math.min(min, cap)}
          onChange={(e) => setMin(e.target.value)}
          disabled={disabled}
          className={`${rangeClass} bottom-0`}
          aria-label="Minimum price — drag in the lower half of the bar"
        />
      </div>
      {!hideValueSummary && (
        <div className="flex justify-between text-xs font-medium text-slate-600 tabular-nums">
          <span className="text-slate-800">${min}</span>
          <span className="text-slate-400">—</span>
          <span className="text-slate-800">${max}</span>
        </div>
      )}
      {!hideValueSummary && (
        <p className="text-[11px] text-slate-500 leading-snug">
          Uses the first number in each listing&apos;s price (e.g. &quot;$99&quot; or &quot;From $50/hr&quot;).
        </p>
      )}
    </div>
  );
}
