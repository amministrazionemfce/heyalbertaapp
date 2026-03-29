import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { CATEGORIES, getTierInfo } from '../../data/categories';
import { Loader2, Store } from 'lucide-react';
import ConfirmActionModal from '../../components/ConfirmActionModal';
import { useAdminVendors } from './useAdminVendors';
import { AdminVendorsFiltersBar } from './AdminVendorsFiltersBar';
import { AdminVendorsTable } from './AdminVendorsTable';
import { AdminVendorsGrid } from './AdminVendorsGrid';
import { adminVendorPath } from '../../constants';

function vendorRecordId(v) {
  return v?.id || v?._id;
}

export function AdminVendorsSection({ onUpdate }) {
  const navigate = useNavigate();
  const [deleteModalVendor, setDeleteModalVendor] = useState(null);
  const [deleteNotifyEmail, setDeleteNotifyEmail] = useState(false);

  const {
    loading,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    viewMode,
    setViewMode,
    actionLoading,
    approveVendor,
    rejectVendor,
    deleteVendor,
    filteredVendors,
    clearFilters,
  } = useAdminVendors({ onUpdate });

  const getCategoryName = (categoryId) => CATEGORIES.find((c) => c.id === categoryId)?.name;

  const goToVendorDetail = (v) => {
    const id = vendorRecordId(v);
    if (id) navigate(adminVendorPath(id));
  };

  const openDeleteModal = (v) => {
    setDeleteModalVendor(v);
    setDeleteNotifyEmail(false);
  };

  const deleteModalId = deleteModalVendor ? vendorRecordId(deleteModalVendor) : null;

  const handleConfirmDelete = async () => {
    if (!deleteModalId) return;
    await deleteVendor(deleteModalId, { notifyEmail: deleteNotifyEmail });
    setDeleteModalVendor(null);
  };

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
          <Loader2 className="w-8 h-8 animate-spin text-admin-600" />
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
          onSeeDetails={goToVendorDetail}
          onRequestDelete={openDeleteModal}
        />
      ) : (
        <AdminVendorsGrid
          vendors={filteredVendors}
          getCategoryName={getCategoryName}
          getTierInfo={getTierInfo}
          onSeeDetails={goToVendorDetail}
          onApprove={approveVendor}
          onReject={rejectVendor}
          onRequestDelete={openDeleteModal}
        />
      )}

      <ConfirmActionModal
        open={!!deleteModalVendor}
        onOpenChange={(o) => !o && setDeleteModalVendor(null)}
        title="Delete this vendor?"
        description={
          <>
            <span className="font-semibold text-slate-800">
              {deleteModalVendor?.name ?? 'This vendor'}
            </span>{' '}
            will be permanently removed.{' '}
            <strong className="text-slate-800">All listings</strong> tied to this vendor and{' '}
            <strong className="text-slate-800">all reviews</strong> for this vendor will be deleted as
            well.
          </>
        }
        confirmLabel="Delete vendor"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        loading={actionLoading}
        checkbox={{
          id: 'admin-vendor-delete-notify-email',
          label: 'Notify vendor by email',
          checked: deleteNotifyEmail,
          onChange: setDeleteNotifyEmail,
          testId: 'vendor-delete-notify-email',
        }}
        footerNote="This cannot be undone. Double-check before confirming."
        data-testid="admin-delete-vendor-modal"
      />
    </div>
  );
}
