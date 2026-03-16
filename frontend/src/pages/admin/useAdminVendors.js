import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminAPI } from '../../lib/api';
import { CATEGORIES } from '../../data/categories';
import { toast } from 'sonner';

export function useAdminVendors({ onUpdate } = {}) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'table' | 'list'
  const [detailVendor, setDetailVendor] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await adminAPI.vendors(params);
      setVendors(Array.isArray(res.data) ? res.data : []);
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const approveVendor = useCallback(
    async (id) => {
      setActionLoading(true);
      try {
        await adminAPI.approveVendor(id);
        toast.success('Vendor approved');
        await fetchVendors();
        onUpdate?.();
        setDetailVendor((prev) => (prev?.id === id ? { ...prev, status: 'approved' } : prev));
      } catch {
        toast.error('Failed to approve');
      } finally {
        setActionLoading(false);
      }
    },
    [fetchVendors, onUpdate]
  );

  const rejectVendor = useCallback(
    async (id) => {
      setActionLoading(true);
      try {
        await adminAPI.rejectVendor(id);
        toast.success('Vendor rejected');
        await fetchVendors();
        onUpdate?.();
        setDetailVendor((prev) => (prev?.id === id ? { ...prev, status: 'rejected' } : prev));
      } catch {
        toast.error('Failed to reject');
      } finally {
        setActionLoading(false);
      }
    },
    [fetchVendors, onUpdate]
  );

  const featureVendor = useCallback(
    async (id, featured) => {
      setActionLoading(true);
      try {
        await adminAPI.featureVendor(id, featured);
        toast.success(featured ? 'Vendor featured' : 'Vendor unfeatured');
        await fetchVendors();
        onUpdate?.();
        setDetailVendor((prev) => (prev?.id === id ? { ...prev, featured } : prev));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update feature');
      } finally {
        setActionLoading(false);
      }
    },
    [fetchVendors, onUpdate]
  );

  const filteredVendors = useMemo(() => {
    if (!search) return vendors;
    const q = search.toLowerCase();
    return vendors.filter((v) => {
      const name = (v.name || '').toLowerCase();
      const city = (v.city || '').toLowerCase();
      const categoryName = (CATEGORIES.find((c) => c.id === v.category)?.name || '').toLowerCase();
      return name.includes(q) || city.includes(q) || categoryName.includes(q);
    });
  }, [vendors, search]);

  const openDetail = useCallback((v) => setDetailVendor(v), []);
  const closeDetail = useCallback(() => setDetailVendor(null), []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('');
    fetchVendors();
  }, [fetchVendors]);

  return {
    vendors,
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
    refresh: fetchVendors,
    clearFilters,
  };
}

