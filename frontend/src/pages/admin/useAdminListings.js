import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../lib/api';
import { CATEGORIES } from '../../data/categories';

export function useAdminListings({ onUpdate } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdFromUrl = searchParams.get('userId');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'table' | 'list'
  const [detailListing, setDetailListing] = useState(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await adminAPI.listings(params);
      const rows = Array.isArray(res.data) ? res.data : [];
      setListings(rows);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const filteredListings = useMemo(() => {
    let rows = listings;
    // Legacy support: if a userId is provided from the Users table "view listings", filter to that owner.
    if (userIdFromUrl) {
      rows = rows.filter((l) => String(l.userId || '') === String(userIdFromUrl));
    }
    if (categoryFilter) {
      rows = rows.filter((l) => String(l.categoryId || '') === categoryFilter);
    }
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((l) => {
      const title = (l.title || '').toLowerCase();
      const desc = (l.description || '').toLowerCase();
      const businessName = (l.businessName || '').toLowerCase();
      const categoryName = (CATEGORIES.find((c) => c.id === l.categoryId)?.name || '').toLowerCase();
      return (
        title.includes(q) ||
        desc.includes(q) ||
        businessName.includes(q) ||
        categoryName.includes(q)
      );
    });
  }, [listings, search, categoryFilter, userIdFromUrl]);

  const openDetail = useCallback((l) => setDetailListing(l), []);
  const closeDetail = useCallback(() => setDetailListing(null), []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    if (userIdFromUrl) {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.delete('userId');
          return p;
        },
        { replace: true }
      );
    }
    fetchListings();
  }, [fetchListings, userIdFromUrl, setSearchParams]);

  return {
    listings,
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
    refresh: fetchListings,
    clearFilters,
  };
}
