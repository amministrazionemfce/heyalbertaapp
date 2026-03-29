/**
 * Dual-thumb price range — pointer-driven thumbs for smooth dragging and clear cursors (grab / grabbing).
 * Scale $0 … PRICE_SLIDER_MAX, step 50.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const step = 50;
  const trackRef = useRef(null);
  const stateRef = useRef({ min, max });
  useEffect(() => {
    stateRef.current = { min, max };
  }, [min, max]);

  const [dragging, setDragging] = useState(null);

  const clampVal = useCallback(
    (v) => {
      const n = Math.round(Number(v) / step) * step;
      return Math.min(Math.max(0, n), cap);
    },
    [cap, step]
  );

  const valueFromClientX = useCallback(
    (clientX) => {
      const el = trackRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const w = rect.width;
      if (w <= 0) return 0;
      const t = Math.min(1, Math.max(0, (clientX - rect.left) / w));
      return clampVal(t * cap);
    },
    [cap, clampVal]
  );

  const commit = useCallback(
    (which, v) => {
      const n = clampVal(v);
      const { min: curMin, max: curMax } = stateRef.current;
      if (which === 'min') {
        if (n <= curMax) onChange({ min: n, max: curMax });
        else onChange({ min: curMax, max: n });
      } else if (n >= curMin) {
        onChange({ min: curMin, max: n });
      } else {
        onChange({ min: n, max: curMin });
      }
    },
    [clampVal, onChange]
  );

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => {
      commit(dragging, valueFromClientX(e.clientX));
    };
    const up = () => setDragging(null);
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
    };
  }, [dragging, commit, valueFromClientX]);

  const onTrackPointerDown = (e) => {
    if (disabled || e.button !== 0) return;
    const v = valueFromClientX(e.clientX);
    const { min: curMin, max: curMax } = stateRef.current;
    const distMin = Math.abs(v - curMin);
    const distMax = Math.abs(v - curMax);
    const which = distMin <= distMax ? 'min' : 'max';
    setDragging(which);
    commit(which, v);
    e.preventDefault();
  };

  const onThumbPointerDown = (e, which) => {
    if (disabled || e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    setDragging(which);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const leftPct = (min / cap) * 100;
  const widthPct = Math.max(0, (max / cap) * 100 - leftPct);

  return (
    <div className={`space-y-2 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      <div
        ref={trackRef}
        className="relative h-12 w-full cursor-pointer select-none px-0.5 touch-none"
        style={{ touchAction: 'none' }}
        role="group"
        aria-label="Price range. Drag the white handles or click the track."
        onPointerDown={onTrackPointerDown}
      >
        <div
          className="pointer-events-none absolute left-0 right-0 top-1/2 z-0 h-3 -translate-y-1/2 rounded-full bg-slate-200/95 shadow-inner"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-1/2 z-0 h-3 -translate-y-1/2 rounded-full bg-[#1e3a8a] shadow-sm"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
          aria-hidden
        />

        <button
          type="button"
          tabIndex={0}
          className="absolute top-1/2 z-20 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-0 bg-transparent p-0 touch-none active:cursor-grabbing"
          style={{ left: `${leftPct}%` }}
          onPointerDown={(e) => onThumbPointerDown(e, 'min')}
          aria-label={`Minimum price ${min} dollars`}
          aria-valuemin={0}
          aria-valuemax={cap}
          aria-valuenow={min}
          role="slider"
        >
          <span className="pointer-events-none block h-4 w-4 rounded-full border border-slate-200/80 bg-white shadow-md ring-0" />
        </button>
        <button
          type="button"
          tabIndex={0}
          className="absolute top-1/2 z-[21] flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-0 bg-transparent p-0 touch-none active:cursor-grabbing"
          style={{ left: `${leftPct + widthPct}%` }}
          onPointerDown={(e) => onThumbPointerDown(e, 'max')}
          aria-label={`Maximum price ${max} dollars`}
          aria-valuemin={0}
          aria-valuemax={cap}
          aria-valuenow={max}
          role="slider"
        >
          <span className="pointer-events-none block h-4 w-4 rounded-full border border-slate-200/80 bg-white shadow-md" />
        </button>
      </div>
      {!hideValueSummary && (
        <div className="flex justify-between text-xs font-medium text-slate-600 tabular-nums">
          <span className="text-slate-800">${min}</span>
          <span className="text-slate-400">—</span>
          <span className="text-slate-800">${max}</span>
        </div>
      )}
      {!hideValueSummary && (
        <p className="text-[11px] leading-snug text-slate-500">
          Uses the first number in each listing&apos;s price (e.g. &quot;$99&quot; or &quot;From $50/hr&quot;).
        </p>
      )}
    </div>
  );
}
