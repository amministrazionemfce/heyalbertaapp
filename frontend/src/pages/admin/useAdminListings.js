import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../lib/api';
import { CATEGORIES } from '../../data/categories';

export function useAdminListings({ onUpdate } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdFromUrl = searchParams.get('userId');
  const [listings, setListings] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
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
      const byUser = new Map();
      for (const l of rows) {
        const uid = String(l.userId || '').trim();
        if (!uid) continue;
        const label = (l.sellerTitle || l.title || '').trim() || 'Unnamed listing';
        if (!byUser.has(uid)) byUser.set(uid, label);
      }
      setSellers(
        [...byUser.entries()]
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      );
    } catch {
      setListings([]);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    if (userIdFromUrl) setSellerFilter(userIdFromUrl);
  }, [userIdFromUrl]);

  const filteredListings = useMemo(() => {
    let rows = listings;
    if (sellerFilter) {
      rows = rows.filter((l) => String(l.userId || '') === sellerFilter);
    }
    if (categoryFilter) {
      rows = rows.filter((l) => String(l.categoryId || '') === categoryFilter);
    }
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((l) => {
      const title = (l.title || '').toLowerCase();
      const desc = (l.description || '').toLowerCase();
      const sellerTitle = (l.sellerTitle || l.title || '').toLowerCase();
      const categoryName = (CATEGORIES.find((c) => c.id === l.categoryId)?.name || '').toLowerCase();
      return title.includes(q) || desc.includes(q) || sellerTitle.includes(q) || categoryName.includes(q);
    });
  }, [listings, search, sellerFilter, categoryFilter]);

  const openDetail = useCallback((l) => setDetailListing(l), []);
  const closeDetail = useCallback(() => setDetailListing(null), []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('');
    setSellerFilter('');
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
    vendors: sellers,
    loading,
    statusFilter,
    setStatusFilter,
    vendorFilter: sellerFilter,
    setVendorFilter: setSellerFilter,
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
