import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { CATEGORIES } from '../../data/categories';
import { ChevronLeft, ChevronRight, Loader2, List } from 'lucide-react';
import { useAdminListings } from './useAdminListings';
import { AdminListingsFiltersBar } from './AdminListingsFiltersBar';
import { AdminListingsTable } from './AdminListingsTable';
import { AdminListingsGrid } from './AdminListingsGrid';
import { AdminListingDetailDialog } from './AdminListingDetailDialog';
import { listingPath } from '../../constants';

const LISTINGS_PAGE_SIZE = 20;

export function AdminListingsSection({ onUpdate }) {
  const navigate = useNavigate();
  const {
    loading,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    search,
    setSearch,
    viewMode,
    setViewMode,
    detailListing,
    openDetail,
    closeDetail,
    filteredListings,
    clearFilters,
  } = useAdminListings({ onUpdate });

  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, categoryFilter]);

  const totalFiltered = filteredListings.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / LISTINGS_PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const paginatedListings = useMemo(() => {
    const start = (page - 1) * LISTINGS_PAGE_SIZE;
    return filteredListings.slice(start, start + LISTINGS_PAGE_SIZE);
  }, [filteredListings, page]);

  const rangeStart = totalFiltered === 0 ? 0 : (page - 1) * LISTINGS_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * LISTINGS_PAGE_SIZE, totalFiltered);

  const getCategoryName = (categoryId) => CATEGORIES.find((c) => c.id === categoryId)?.name;

  return (
    <div className="space-y-6" data-testid="admin-listings-section">
      <AdminListingsFiltersBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-spruce-800" />
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <List className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No listings found</p>
          <p className="text-sm text-slate-500 mt-1">
            {search || categoryFilter
              ? 'Try a different search, category, or clear filters.'
              : 'Change the status filter or wait for new listings.'}
          </p>
          {(search || statusFilter || categoryFilter) && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {viewMode === 'table' ? (
            <AdminListingsTable
              listings={paginatedListings}
              getCategoryName={getCategoryName}
              onView={openDetail}
            />
          ) : (
            <AdminListingsGrid listings={paginatedListings} onView={openDetail} />
          )}

          {totalFiltered > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Showing{' '}
                <span className="font-medium text-slate-800">
                  {rangeStart}–{rangeEnd}
                </span>{' '}
                of <span className="font-medium text-slate-800">{totalFiltered}</span>
                <span className="mx-1.5 text-slate-400">·</span>
                Page <span className="font-medium text-slate-800">{page}</span> of {totalPages}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <AdminListingDetailDialog
        listing={detailListing}
        onClose={closeDetail}
        getCategoryName={getCategoryName}
        onViewPublic={(id) => navigate(listingPath(id))}
      />
    </div>
  );
}
