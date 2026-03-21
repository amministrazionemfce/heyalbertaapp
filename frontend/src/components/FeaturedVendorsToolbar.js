import { Star, Users } from 'lucide-react';

/**
 * Segmented control: Featured vs All vendors (homepage).
 */
export default function FeaturedVendorsToolbar({
  showAllVendors,
  onToggle,
  className = '',
  allButtonTestId = 'view-all-vendors',
  'data-testid': dataTestId = 'featured-vendors-toolbar',
}) {
  return (
    <div
      className={`inline-flex rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50 to-white p-1.5 shadow-sm ${className}`.trim()}
      role="group"
      aria-label="Vendor listing view"
      data-testid={dataTestId}
    >
      <button
        type="button"
        onClick={() => showAllVendors && onToggle()}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-sm font-semibold transition-all min-w-[8rem] sm:min-w-[9rem] ${
          !showAllVendors
            ? 'bg-white text-spruce-800 shadow-md border border-slate-200/80'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
        }`}
        data-testid="featured-vendors-toggle"
      >
        <Star className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
        Featured
      </button>
      <button
        type="button"
        onClick={() => !showAllVendors && onToggle()}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-sm font-semibold transition-all min-w-[8rem] sm:min-w-[9rem] ${
          showAllVendors
            ? 'bg-white text-spruce-800 shadow-md border border-slate-200/80'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
        }`}
        data-testid={allButtonTestId}
      >
        <Users className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
        Show all
      </button>
    </div>
  );
}
