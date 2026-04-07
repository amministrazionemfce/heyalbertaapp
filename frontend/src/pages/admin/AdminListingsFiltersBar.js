import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { CATEGORIES } from '../../data/categories';
import { Filter, LayoutGrid, Search, Table as TableIcon } from 'lucide-react';

const STATUS_IDLE = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
const STATUS_ACTIVE = 'bg-spruce-800 text-white border-slate-800 shadow-sm';

export function AdminListingsFiltersBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  viewMode,
  onViewModeChange,
}) {
  const categorySelectValue = categoryFilter || 'all';

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 text-slate-900 shadow-sm"
      data-testid="admin-listings-filters"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="w-full max-w-xs shrink-0">
          <Label htmlFor="admin-listings-search" className="text-slate-600 text-xs font-medium mb-1.5 block">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="admin-listings-search"
              placeholder="Title, vendor, or category…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-10 bg-white text-slate-900 border-slate-200"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-600 flex items-center gap-1 shrink-0 font-medium">
              <Filter className="w-4 h-4 text-slate-500" /> Status
            </span>
            {[
              { value: '', key: 'all', label: 'All' },
              { value: 'draft', key: 'draft', label: 'Draft' },
              { value: 'published', key: 'published', label: 'Published' },
            ].map(({ value, key, label }) => {
              const isActive = statusFilter === value;
              return (
                <button
                  key={key}
                  type="button"
                  className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? STATUS_ACTIVE : STATUS_IDLE
                  }`}
                  onClick={() => onStatusFilterChange(value)}
                  data-testid={`listings-filter-${key}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="w-full max-w-[min(100%,20rem)] sm:w-52 shrink-0">
            <Label className="text-slate-600 text-xs font-medium mb-1.5 block">By category</Label>
            <Select
              value={categorySelectValue}
              onValueChange={(v) => onCategoryFilterChange(v === 'all' ? '' : v)}
            >
              <SelectTrigger className="h-10" data-testid="listings-filter-category">
                <SelectValue placeholder="All categories">
                  {categorySelectValue === 'all'
                    ? 'All categories'
                    : CATEGORIES.find((c) => c.id === categoryFilter)?.name ?? 'Category'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1 shrink-0 lg:ml-auto">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-white/80'
            }`}
            data-testid="listings-view-table"
            title="Table view"
          >
            <TableIcon className="w-4 h-4" /> Table
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-white/80'
            }`}
            data-testid="listings-view-list"
            title="Card view (same as directory)"
          >
            <LayoutGrid className="w-4 h-4" /> Cards
          </button>
        </div>
      </div>
    </div>
  );
}
