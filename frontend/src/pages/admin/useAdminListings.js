import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminAPI } from '../../lib/api';
import { CATEGORIES } from '../../data/categories';
import { toast } from 'sonner';

export function useAdminListings({ onUpdate } = {}) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'table' | 'list'
  const [detailListing, setDetailListing] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await adminAPI.listings(params);
      setListings(Array.isArray(res.data) ? res.data : []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const featureListing = useCallback(
    async (id, featured) => {
      setActionLoading(true);
      try {
        await adminAPI.featureListing(id, featured);
        toast.success(featured ? 'Listing featured' : 'Listing unfeatured');
        await fetchListings();
        onUpdate?.();
        setDetailListing((prev) => (prev?.id === id ? { ...prev, featured } : prev));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update feature');
      } finally {
        setActionLoading(false);
      }
    },
    [fetchListings, onUpdate]
  );

  const filteredListings = useMemo(() => {
    if (!search) return listings;
    const q = search.toLowerCase();
    return listings.filter((l) => {
      const title = (l.title || '').toLowerCase();
      const desc = (l.description || '').toLowerCase();
      const vendorName = (l.vendorName || '').toLowerCase();
      const categoryName = (CATEGORIES.find((c) => c.id === l.categoryId)?.name || '').toLowerCase();
      return title.includes(q) || desc.includes(q) || vendorName.includes(q) || categoryName.includes(q);
    });
  }, [listings, search]);

  const openDetail = useCallback((l) => setDetailListing(l), []);
  const closeDetail = useCallback(() => setDetailListing(null), []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('');
    fetchListings();
  }, [fetchListings]);

  return {
    listings,
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
    refresh: fetchListings,
    clearFilters,
  };
}
