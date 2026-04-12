import * as React from 'react';

const variants = {
  default: 'bg-spruce-700 text-white hover:bg-spruce-800',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  destructive: 'bg-red-100 text-red-700',
  outline: 'text-slate-900 border border-slate-200',
  /** Nav / sidebar counts — explicit colors so parent `text-white` / Tailwind order never hides the number */
  counter: '!bg-spruce-700 !text-white border border-slate-300  font-bold tabular-nums shadow-sm',
};

export function Badge({ className = '', variant = 'default', ...props }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant] || variants.default} ${className}`.trim()}
      {...props}
    />
  );
}
