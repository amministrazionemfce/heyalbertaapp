import { Input } from '../../components/ui/input';
import { Filter, LayoutGrid, Search, Table as TableIcon } from 'lucide-react';

const STATUS_BUTTON_STYLE = {
  all: 'border-slate-300 hover:bg-slate-50',
  draft: 'border-slate-300 bg-slate-50 hover:bg-slate-100',
  published: 'border-spruce-300 bg-spruce-50 text-spruce-800 hover:bg-spruce-100',
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
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by title, vendor, or category…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10 bg-white"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-slate-500 flex items-center gap-1">
          <Filter className="w-4 h-4" /> Status:
        </span>
        {[
          { value: '', key: 'all', label: 'All' },
          { value: 'draft', key: 'draft', label: 'Draft' },
          { value: 'published', key: 'published', label: 'Published' },
        ].map(({ value, key, label }) => {
          const isActive = statusFilter === value;
          const className = isActive
            ? value === 'published'
              ? 'bg-spruce-700 text-white border-spruce-700 hover:bg-spruce-800'
              : value === 'draft'
                ? 'bg-slate-600 text-white border-slate-600 hover:bg-slate-700'
                : 'bg-slate-700 text-white border-slate-700 hover:bg-slate-800'
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

      <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1 bg-white">
        <button
          type="button"
          onClick={() => onViewModeChange('table')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'table' ? 'bg-spruce-700 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
          data-testid="listings-view-table"
          title="Table view"
        >
          <TableIcon className="w-4 h-4" /> Table
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'list' ? 'bg-spruce-700 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
          data-testid="listings-view-list"
          title="Grid view"
        >
          <LayoutGrid className="w-4 h-4" /> List
        </button>
      </div>
    </div>
  );
}
