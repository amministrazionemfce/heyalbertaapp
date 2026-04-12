import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { CATEGORIES } from '../../data/categories';
import { ChevronLeft, ChevronRight, Loader2, List, Trash2, AlertTriangle } from 'lucide-react';
import { useAdminListings } from './useAdminListings';
import { AdminListingsFiltersBar } from './AdminListingsFiltersBar';
import { AdminListingsTable } from './AdminListingsTable';
import { AdminListingsGrid } from './AdminListingsGrid';
import { AdminListingDetailDialog } from './AdminListingDetailDialog';
import { listingPath } from '../../constants';
import { adminAPI } from '../../lib/api';

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
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAll, setDeletingAll] = useState(false);

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

  const handleDeleteAllListings = async () => {
    try {
      setDeletingAll(true);
      await adminAPI.deleteAllListings(deletePassword);
      // Refresh listings after deletion
      onUpdate?.();
      setShowDeleteAllModal(false);
      setDeletePassword('');
      alert('All listings have been successfully deleted.');
    } catch (error) {
      alert('Error deleting listings: ' + (error.message || 'Unknown error'));
    } finally {
      setDeletingAll(false);
    }
  };

  const rangeStart = totalFiltered === 0 ? 0 : (page - 1) * LISTINGS_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * LISTINGS_PAGE_SIZE, totalFiltered);

  const getCategoryName = (categoryId) => CATEGORIES.find((c) => c.id === categoryId)?.name;

  return (
    <div className="space-y-6" data-testid="admin-listings-section">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
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
        </div>
        {/* <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteAllModal(true)}
          className="gap-2 whitespace-nowrap"
        >
          <Trash2 className="h-4 w-4" />
          Delete All
        </Button> */}
      </div>

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

      {/* Delete All Listings Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-xl">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Delete All Listings</h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                This action will permanently delete <strong>all listings and their reviews</strong>. This cannot be undone.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm with your admin password:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteAllModal(false);
                  setDeletePassword('');
                }}
                disabled={deletingAll}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteAllListings}
                disabled={deletingAll || !deletePassword.trim()}
                className="gap-2"
              >
                {deletingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete All Permanently
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
