import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Filter, LayoutGrid, Search, Table as TableIcon } from 'lucide-react';
import { getStatusFilterClass, getFeaturedFilterClass } from './vendorStatus';

export function AdminVendorsFiltersBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  featuredFilter,
  onFeaturedFilterChange,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, city, or category…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-10 bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500 flex items-center gap-1 shrink-0">
            <Filter className="w-4 h-4" /> Status:
          </span>
          {[
            { value: '', key: 'all', label: 'All' },
            { value: 'pending', key: 'pending', label: 'Pending' },
            { value: 'approved', key: 'approved', label: 'Approved' },
            { value: 'rejected', key: 'rejected', label: 'Rejected' },
          ].map(({ value, key, label }) => {
            const isActive = statusFilter === value;
            const className = getStatusFilterClass(value, { active: isActive });
            return (
              <Button
                key={key}
                variant="outline"
                size="sm"
                className={className}
                onClick={() => onStatusFilterChange(value)}
                data-testid={`filter-${key}`}
              >
                {label}
              </Button>
            );
          })}
          <span className="text-sm text-slate-500 flex items-center gap-1 shrink-0 ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-slate-200">
            Featured:
          </span>
          {[
            { value: 'all', key: 'feat-all', label: 'All' },
            { value: 'featured', key: 'feat-yes', label: 'Featured' },
            { value: 'unfeatured', key: 'feat-no', label: 'Not featured' },
          ].map(({ value, key, label }) => {
            const isActive = featuredFilter === value;
            return (
              <Button
                key={key}
                variant="outline"
                size="sm"
                className={getFeaturedFilterClass(value, { active: isActive })}
                onClick={() => onFeaturedFilterChange(value)}
                data-testid={`filter-featured-${key}`}
              >
                {label}
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-slate-200/90 bg-slate-50 p-1 shadow-sm shrink-0">
        <button
          type="button"
          onClick={() => onViewModeChange('table')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'table'
              ? 'bg-spruce-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-white hover:text-spruce-800'
          }`}
          data-testid="view-table"
          title="Table view"
        >
          <TableIcon className="w-4 h-4" /> Table
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('list')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'list'
              ? 'bg-spruce-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-white hover:text-spruce-800'
          }`}
          data-testid="view-list"
          title="List view"
        >
          <LayoutGrid className="w-4 h-4" /> List
        </button>
        </div>
    </div>
  );
}

