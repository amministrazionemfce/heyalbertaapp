import { CATEGORIES, getCategoryIcon } from '../data/categories';

/**
 * Category Lucide icon (+ optional label) from `CATEGORIES`.
 */
export default function ListingCategoryLabel({ categoryId, className = '', showTitle = true }) {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  const name = cat?.name || categoryId || 'Listing';
  const Icon = getCategoryIcon(cat?.icon);

  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center gap-2 ${className}`.trim()}
      data-testid="listing-category-label"
    >
      <Icon className="h-4 w-4 shrink-0 text-spruce-600" strokeWidth={2} aria-hidden />
      {showTitle ? (
        <span className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-wide text-spruce-800">
          {name}
        </span>
      ) : (
        <span className="sr-only">{name}</span>
      )}
    </span>
  );
}
