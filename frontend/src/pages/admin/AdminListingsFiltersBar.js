import { Input } from '../../components/ui/input';
import { Filter, LayoutGrid, Search, Table as TableIcon } from 'lucide-react';

const STATUS_BUTTON_STYLE = {
  all: 'border-white/25 bg-white/10 text-white hover:bg-white/15',
  draft: 'border-white/25 bg-white/10 text-white hover:bg-white/15',
  published: 'border-white/30 bg-white/15 text-white hover:bg-white/20',
};

export function AdminListingsFiltersBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div
      className="rounded-xl bg-spruce-800 p-4 md:p-5 text-white shadow-md border border-spruce-900/40"
      data-testid="admin-listings-filters"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-spruce-200" />
          <Input
            placeholder="Search by title, vendor, or category…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-10 bg-white/95 text-slate-900 border-0 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-white/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-white/90 flex items-center gap-1 shrink-0 font-medium">
            <Filter className="w-4 h-4 text-white/80" /> Status:
          </span>
          {[
            { value: '', key: 'all', label: 'All' },
            { value: 'draft', key: 'draft', label: 'Draft' },
            { value: 'published', key: 'published', label: 'Published' },
          ].map(({ value, key, label }) => {
            const isActive = statusFilter === value;
            const className = isActive
              ? value === 'published'
                ? 'bg-white text-spruce-800 border-white shadow-sm font-semibold'
                : value === 'draft'
                  ? 'bg-white text-spruce-800 border-white shadow-sm font-semibold'
                  : 'bg-white text-spruce-800 border-white shadow-sm font-semibold'
              : STATUS_BUTTON_STYLE[key] || STATUS_BUTTON_STYLE.all;
            return (
              <button
                key={key}
                type="button"
                className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${className}`}
                onClick={() => onStatusFilterChange(value)}
                data-testid={`listings-filter-${key}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-white/20 bg-spruce-900/30 p-1 shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'table' ? 'bg-white text-spruce-800 shadow-sm' : 'text-white/90 hover:bg-white/10'
            }`}
            data-testid="listings-view-table"
            title="Table view"
          >
            <TableIcon className="w-4 h-4" /> Table
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list' ? 'bg-white text-spruce-800 shadow-sm' : 'text-white/90 hover:bg-white/10'
            }`}
            data-testid="listings-view-list"
            title="Grid view"
          >
            <LayoutGrid className="w-4 h-4" /> List
          </button>
        </div>
      </div>
    </div>
  );
}
