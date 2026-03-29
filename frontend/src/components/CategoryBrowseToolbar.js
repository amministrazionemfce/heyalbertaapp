import { Search, ChevronDown } from 'lucide-react';
import { Input } from './ui/input';

/**
 * Category search + sort row (no expand/collapse).
 */
export default function CategoryBrowseToolbar({
  categorySearch,
  onCategorySearchChange,
  categoryOrder,
  onCategoryOrderChange,
}) {
  return (
    <div className="mb-9 flex w-full justify-center px-1">
      <div className="flex w-full max-w-xl flex-col gap-2 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-3">
      <div className="relative w-full min-w-0 max-w-full sm:max-w-xs md:max-w-sm flex items-center sm:shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
        <Input
          placeholder="Search categories…"
          value={categorySearch}
          onChange={(e) => onCategorySearchChange(e.target.value)}
          className="pl-9 h-11 border-slate-200/90 rounded-xl bg-white shadow-sm"
          data-testid="category-search"
        />
      </div>

      <div className="relative w-full min-w-[10.5rem] max-w-full sm:w-auto sm:min-w-[11rem] sm:max-w-[13rem] sm:shrink-0">
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
      </div>
    </div>
  );
}
