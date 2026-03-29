import { Search, ChevronUp, LayoutGrid, ChevronDown } from 'lucide-react';
import { Input } from './ui/input';

/**
 * Single row: category search, sort/filter, optional expand-all-categories control.
 */
export default function CategoryBrowseToolbar({
  categorySearch,
  onCategorySearchChange,
  categoryOrder,
  onCategoryOrderChange,
  showExpandToggle,
  categoriesExpanded,
  onToggleCategoriesExpanded,
  totalCategoriesShown,
}) {
  return (  
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3 mb-9">
        <div className="relative flex-1 min-w-0 flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
          <Input
            placeholder="Search categories…"
            value={categorySearch}
            onChange={(e) => onCategorySearchChange(e.target.value)}
            className="pl-9 h-11 border-slate-200/90 rounded-xl bg-white shadow-sm"
            data-testid="category-search"
          />
        </div>

        <div className="flex flex-row flex-wrap items-stretch gap-2 sm:shrink-0 sm:w-auto w-full">
          <div className="relative min-w-[10.5rem] flex-1 sm:flex-initial sm:min-w-[11rem]">
            <select
              value={categoryOrder}
              onChange={(e) => onCategoryOrderChange(e.target.value)}
              className="h-11 w-full pl-3 pr-10 rounded-xl border border-slate-200/90 bg-white text-slate-700 font-medium text-sm cursor-pointer shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-spruce-500/20 focus:border-spruce-300"
              data-testid="category-order"
            >
              <option value="listing">By listings</option>
              <option value="review">By review</option>
              <option value="popular">Popular</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              aria-hidden
            />
          </div>

          {showExpandToggle && (
            <button
              type="button"
              onClick={onToggleCategoriesExpanded}
              className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900"
              data-testid="categories-show-more"
            >
              {categoriesExpanded ? (
                <>
                  Show less
                  <ChevronUp className="w-4 h-4 shrink-0" aria-hidden />
                </>
              ) : (
                <>
                  <LayoutGrid className="w-4 h-4 shrink-0 text-slate-500" aria-hidden />
                  Show all ({totalCategoriesShown})
                </>
              )}
            </button>
          )}
        </div>
      </div>
  );
}
