import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Filter, LayoutGrid, Search, Table as TableIcon } from 'lucide-react';
import { getStatusFilterClass } from './vendorStatus';

export function AdminVendorsFiltersBar({
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
          placeholder="Search by name, city, or category…"
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
      </div>

      <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1 bg-white">
        <button
          type="button"
          onClick={() => onViewModeChange('table')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'table' ? 'bg-spruce-700 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
          data-testid="view-table"
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
          data-testid="view-list"
          title="List view"
        >
          <LayoutGrid className="w-4 h-4" /> List
        </button>
      </div>
    </div>
  );
}

