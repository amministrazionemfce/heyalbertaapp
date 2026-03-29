/**
 * Lightweight SVG line chart (no extra deps). Points are normalized to the drawable area.
 */
export function SimpleLineChart({ title, labels, values, color = '#0ea5e9', height = 140 }) {
  const w = 320;
  const pad = { t: 8, r: 8, b: 28, l: 36 };
  const innerW = w - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const nums = (values || []).map((v) => Number(v) || 0);
  const max = Math.max(1, ...nums);
  const min = 0;
  const range = max - min || 1;
  const n = nums.length;
  const step = n > 1 ? innerW / (n - 1) : 0;

  const pts = nums.map((v, i) => {
    const x = pad.l + i * step;
    const y = pad.t + innerH - ((v - min) / range) * innerH;
    return `${x},${y}`;
  });

  const pathD = pts.length ? `M ${pts.join(' L ')}` : '';

  const yTicks = [0, 0.5, 1].map((frac) => {
    const val = Math.round(min + frac * range);
    const y = pad.t + innerH - frac * innerH;
    return { val, y };
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">{title}</h3>
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-auto" role="img" aria-label={title}>
        {yTicks.map(({ val, y }) => (
          <g key={val}>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
            <text x={4} y={y + 4} className="text-[11px] fill-slate-400" fontSize="11">
              {val}
            </text>
          </g>
        ))}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {(labels || []).map((label, i) => {
          const x = pad.l + i * step;
          return (
            <text
              key={i}
              x={x}
              y={height - 8}
              textAnchor="middle"
              className="text-[11px] fill-slate-500"
              fontSize="11"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
