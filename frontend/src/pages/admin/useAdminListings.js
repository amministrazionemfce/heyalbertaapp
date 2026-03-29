import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminAPI } from '../../lib/api';
import { CATEGORIES } from '../../data/categories';

function vendorIdFromDoc(v) {
  if (!v) return '';
  const raw = v._id ?? v.id;
  return typeof raw === 'object' && raw?.toString ? raw.toString() : String(raw || '');
}

export function useAdminListings({ onUpdate } = {}) {
  const [listings, setListings] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'table' | 'list'
  const [detailListing, setDetailListing] = useState(null);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminAPI.vendors();
        const rows = Array.isArray(res.data) ? res.data : [];
        if (!cancelled) {
          setVendors(
            rows
              .map((v) => ({ id: vendorIdFromDoc(v), name: (v.name || '').trim() || 'Unnamed vendor' }))
              .filter((v) => v.id)
              .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
          );
        }
      } catch {
        if (!cancelled) setVendors([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredListings = useMemo(() => {
    let rows = listings;
    if (vendorFilter) {
      rows = rows.filter((l) => String(l.vendorId || '') === vendorFilter);
    }
    if (categoryFilter) {
      rows = rows.filter((l) => String(l.categoryId || '') === categoryFilter);
    }
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((l) => {
      const title = (l.title || '').toLowerCase();
      const desc = (l.description || '').toLowerCase();
      const vendorName = (l.vendorName || '').toLowerCase();
      const categoryName = (CATEGORIES.find((c) => c.id === l.categoryId)?.name || '').toLowerCase();
      return title.includes(q) || desc.includes(q) || vendorName.includes(q) || categoryName.includes(q);
    });
  }, [listings, search, vendorFilter, categoryFilter]);

  const openDetail = useCallback((l) => setDetailListing(l), []);
  const closeDetail = useCallback(() => setDetailListing(null), []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('');
    setVendorFilter('');
    setCategoryFilter('');
    fetchListings();
  }, [fetchListings]);

  return {
    listings,
    vendors,
    loading,
    statusFilter,
    setStatusFilter,
    vendorFilter,
    setVendorFilter,
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
