export const VENDOR_STATUS = /** @type {const} */ ({
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
});

/** Labels + classes for detail page status pill */
export const statusConfig = {
  pending: { label: 'Pending', className: 'bg-amber-500 text-white border-0' },
  approved: { label: 'Approved', className: 'bg-spruce-700 text-white border-0' },
  rejected: { label: 'Rejected', className: 'bg-red-600 text-white border-0' },
};

export function getStatusPresentation(status) {
  const s = (status || '').toLowerCase();
  if (s === 'approved') return statusConfig.approved;
  if (s === 'rejected') return statusConfig.rejected;
  return statusConfig.pending;
}

/** Badge chips on cards/tables — matches filter bar colors */
export function getVendorStatusBadgeClass(status) {
  const s = (status || '').toLowerCase();
  if (s === 'pending') {
    return 'bg-amber-500 text-white border-0 shadow-sm hover:bg-amber-600';
  }
  if (s === 'approved') {
    return 'bg-spruce-700 text-white border-0 shadow-sm hover:bg-spruce-800';
  }
  if (s === 'rejected') {
    return 'bg-red-600 text-white border-0 shadow-sm hover:bg-red-700';
  }
  return 'bg-slate-100 text-slate-800 border border-slate-200';
}

/**
 * Status filter buttons: active = spruce + white; inactive = white + black text.
 * @param {string} status - 'pending' | 'approved' | 'rejected' | ''
 * @param {{ active?: boolean }} [options]
 */
export function getStatusFilterClass(_status, options = {}) {
  const { active = false } = options;

  if (active) {
    return '!bg-spruce-700 !text-white border-spruce-800 hover:!bg-spruce-800 shadow-sm';
  }

  return '!bg-white !text-black border-slate-300 hover:!bg-slate-50';
}

/** Featured filter chips (All / Featured / Not featured) — same active style as status filters. */
export function getFeaturedFilterClass(_value, options = {}) {
  const { active = false } = options;
  if (active) {
    return '!bg-spruce-700 !text-white border-spruce-800 hover:!bg-spruce-800 shadow-sm';
  }
  return '!bg-white !text-black border-slate-300 hover:!bg-slate-50';
}
