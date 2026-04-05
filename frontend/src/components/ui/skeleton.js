/**
 * Inert placeholder block with pulse animation (loading / skeleton UI).
 */
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/75 ${className}`.trim()}
      {...props}
    />
  );
}
