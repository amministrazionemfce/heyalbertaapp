export const VENDOR_STATUS = /** @type {const} */ ({
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
});

export const statusConfig = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-800 border border-amber-300' },
  approved: { label: 'Approved', className: 'bg-blue-50 text-blue-800 border border-blue-300' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-800 border border-red-300' },
};

export function getStatusPresentation(status) {
  return statusConfig[status] || statusConfig.pending;
}

/**
 * Get reusable Tailwind classes for status filter buttons to ensure
 * consistent colors across filters, table badges, and grid badges.
 *
 * @param {string} status - 'pending' | 'approved' | 'rejected' | 'All' | ''
 * @param {{ active?: boolean }} [options]
 */
export function getStatusFilterClass(status, options = {}) {
  const { active = false } = options;
  const normalized = (status || '').toLowerCase();

  if (active) {
    if (normalized === 'pending') {
      return 'bg-amber-900 text-white hover:bg-spruce-900 border-amber-500';
    }
    if (normalized === 'approved') {
      return 'bg-blue-900 text-white hover:bg-spruce-900 border-blue-500';
    }
    if (normalized === 'rejected') {
      return 'bg-red-900 text-white hover:bg-spruce-900 border-red-500';
    }
    // "All" / default
    return 'bg-spruce-900 text-white hover:bg-spruce-900 border-spruce-700';
  }

  if (normalized === 'pending') {
    return 'border-amber-300 hover:bg-amber-900';
  }
  if (normalized === 'approved') {
    return 'border-blue-300  hover:bg-blue-900';
  }
  if (normalized === 'rejected') {
    return 'border-red-300 hover:bg-red-900';
  }

  // "All" / default
  return 'border-slate-300 hover:bg-slate-50';
}

