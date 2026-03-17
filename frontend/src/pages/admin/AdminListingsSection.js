import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { CATEGORIES } from '../../data/categories';
import { Loader2, List } from 'lucide-react';
import { useAdminListings } from './useAdminListings';
import { AdminListingsFiltersBar } from './AdminListingsFiltersBar';
import { AdminListingsTable } from './AdminListingsTable';
import { AdminListingsGrid } from './AdminListingsGrid';
import { AdminListingDetailDialog } from './AdminListingDetailDialog';

export function AdminListingsSection({ onUpdate }) {
  const navigate = useNavigate();
  const {
    loading,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    viewMode,
    setViewMode,
    detailListing,
    openDetail,
    closeDetail,
    actionLoading,
    featureListing,
    filteredListings,
    clearFilters,
  } = useAdminListings({ onUpdate });

  const getCategoryName = (categoryId) => CATEGORIES.find((c) => c.id === categoryId)?.name;

  return (
    <div className="space-y-6" data-testid="admin-listings-section">
      <AdminListingsFiltersBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-spruce-600" />
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <List className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No listings found</p>
          <p className="text-sm text-slate-500 mt-1">
            {search ? 'Try a different search or clear filters.' : 'Change the status filter or wait for new listings.'}
          </p>
          {(search || statusFilter) && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <AdminListingsTable
          listings={filteredListings}
          getCategoryName={getCategoryName}
          onView={openDetail}
        />
      ) : (
        <AdminListingsGrid
          listings={filteredListings}
          getCategoryName={getCategoryName}
          onView={openDetail}
        />
      )}

      <AdminListingDetailDialog
        listing={detailListing}
        onClose={closeDetail}
        getCategoryName={getCategoryName}
        onToggleFeature={featureListing}
        actionLoading={actionLoading}
        onViewPublic={(id) => navigate(`/listings/${id}`)}
      />
    </div>
  );
}
