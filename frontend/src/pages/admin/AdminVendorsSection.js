import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { CATEGORIES, getTierInfo } from '../../data/categories';
import { Loader2, Store } from 'lucide-react';
import { useAdminVendors } from './useAdminVendors';
import { AdminVendorsFiltersBar } from './AdminVendorsFiltersBar';
import { AdminVendorsTable } from './AdminVendorsTable';
import { AdminVendorsGrid } from './AdminVendorsGrid';
import { AdminVendorDetailDialog } from './AdminVendorDetailDialog';

export function AdminVendorsSection({ onUpdate }) {
  const navigate = useNavigate();
  const {
    loading,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    viewMode,
    setViewMode,
    detailVendor,
    openDetail,
    closeDetail,
    actionLoading,
    approveVendor,
    rejectVendor,
    featureVendor,
    filteredVendors,
    clearFilters,
  } = useAdminVendors({ onUpdate });

  const getCategoryName = (categoryId) => CATEGORIES.find((c) => c.id === categoryId)?.name;

  return (
    <div className="space-y-6" data-testid="admin-vendors-section">
      <AdminVendorsFiltersBar
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
      ) : filteredVendors.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No vendors found</p>
          <p className="text-sm text-slate-500 mt-1">
            {search ? 'Try a different search or clear filters.' : 'Change the status filter or wait for new submissions.'}
          </p>
          {(search || statusFilter) && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <AdminVendorsTable
          vendors={filteredVendors}
          getCategoryName={getCategoryName}
          getTierInfo={getTierInfo}
          onView={openDetail}
        />
      ) : (
        <AdminVendorsGrid
          vendors={filteredVendors}
          getCategoryName={getCategoryName}
          getTierInfo={getTierInfo}
          onView={openDetail}
          onApprove={approveVendor}
          onReject={rejectVendor}
        />
      )}

      <AdminVendorDetailDialog
        vendor={detailVendor}
        onClose={closeDetail}
        getCategoryName={getCategoryName}
        getTierInfo={getTierInfo}
        onApprove={approveVendor}
        onReject={rejectVendor}
        onToggleFeature={featureVendor}
        actionLoading={actionLoading}
        onViewPublic={(id) => navigate(`/vendors/${id}`)}
      />
    </div>
  );
}

