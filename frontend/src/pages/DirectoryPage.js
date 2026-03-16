import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import ListingCard from '../components/ListingCard';
import { listingAPI, vendorAPI } from '../lib/api';
import { useAuth } from '../lib/auth';
import { CATEGORIES, CITIES } from '../data/categories';
import { toast } from 'sonner';
import { Search, X, Loader2, Plus, MapPin, BadgeCheck, Heart } from 'lucide-react';

export default function DirectoryPage() {
  const { user, upgradeToVendor } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [vendorId, setVendorId] = useState(searchParams.get('vendorId') || '');
  const [vendorName, setVendorName] = useState(searchParams.get('vendorName') || '');
  const [vendors, setVendors] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const handleAddListingsClick = () => {
    if (!user) {
      navigate('/register');
      return;
    }
    if (user.role === 'vendor' || user.role === 'admin') {
      navigate('/dashboard?tab=add-listing');
      return;
    }
    setShowUpgradeModal(true);
  };

  const handleUpgradeConfirm = async () => {
    setUpgrading(true);
    try {
      await upgradeToVendor();
      toast.success('Account upgraded to Vendor. You can now add listings.');
      setShowUpgradeModal(false);
      navigate('/dashboard?tab=add-listing');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upgrade failed');
    } finally {
      setUpgrading(false);
    }
  };

  const fetchListings = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 12 };
      if (search) params.search = search;
      if (category) params.categoryId = category;
      if (city) params.city = city;
      if (vendorId) params.vendorId = vendorId;
     
      const res = await listingAPI.directory(params);
      setListings(res.data.listings || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
      setPage(res.data.page ?? p);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setCategory(searchParams.get('category') || '');
    setCity(searchParams.get('city') || '');
     setVendorId(searchParams.get('vendorId') || '');
     setVendorName(searchParams.get('vendorName') || '');
  }, [searchParams]);

  useEffect(() => {
    fetchListings(1);
  }, [category, city, vendorId]);

  useEffect(() => {
    const loadVendors = async () => {
      try {
        const res = await vendorAPI.list({ limit: 100 });
        const list = Array.isArray(res.data) ? res.data : (res.data?.vendors || []);
        setVendors(list);
      } catch {
        setVendors([]);
      }
    };
    loadVendors();
  }, []);

  // When vendors load and we have vendorId in URL but no vendorName, set name from list so dropdown shows name
  useEffect(() => {
    if (vendorId && !vendorName && vendors.length > 0) {
      const v = vendors.find((x) => String(x.id || x._id) === String(vendorId));
      if (v?.name) setVendorName(v.name);
    }
  }, [vendorId, vendorName, vendors]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (city) params.set('city', city);
    if (vendorId) {
      params.set('vendorId', vendorId);
      if (vendorName) params.set('vendorName', vendorName);
    }
    setSearchParams(params);
    fetchListings(1);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setCity('');
    setVendorId('');
    setVendorName('');
    setSearchParams({});
    fetchListings(1);
  };

  const activeFilters = [search, category, city, vendorName || vendorId].filter(Boolean).length;
  const categoryName = CATEGORIES.find(c => c.id === category)?.name;
  // When a category is selected, only show vendors in that category in the vendor dropdown
  const vendorsInCategory = category
    ? vendors.filter((v) => String(v.category) === String(category))
    : vendors;
  const selectedVendorName =
    vendorId && (vendorName || vendors.find((v) => String(v.id || v._id) === String(vendorId))?.name);
  const displayVendorLabel = selectedVendorName || 'All Vendors';
  const displayCategoryLabel = categoryName || 'All Categories';
  const displayCityLabel = city || 'All Cities';

  return (
    <div className="min-h-screen bg-slate-50" data-testid="directory-page">
      {/* Hero / intro section with user-friendly background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-spruce-800 via-spruce-900 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary-500/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
        <div className="relative container mx-auto px-4 md:px-8 max-w-7xl py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-8">
            {/* Left: heading and trust badges */}
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                {categoryName ? `${categoryName} in Alberta` : 'Find Vendors and Services'}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-spruce-200">
                <span className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-secondary-400 flex-shrink-0" /> Verified businesses
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-secondary-400 flex-shrink-0" /> {CITIES.length}+ Alberta cities
                </span>
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-secondary-400 flex-shrink-0" /> Real reviews from newcomers
                </span>
              </div>
            </div>
            {/* Right: Add Listings button — full width on mobile, auto on larger screens */}
            <div className="w-full sm:w-auto flex flex-shrink-0 justify-end sm:justify-end">
              <Button
                type="button"
                onClick={handleAddListingsClick}
                className="w-full sm:w-auto bg-spruce-700 hover:bg-spruce-800 text-white h-11 px-5 gap-2 shadow-lg min-w-[140px]"
                data-testid="add-listings-btn"
              >
                <Plus className="w-4 h-4 flex-shrink-0" />
                Add Listings
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 md:px-8 max-w-7xl py-8">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 mb-8" data-testid="search-filter-bar">
          <p className="text-sm text-slate-500 mb-3">
            Search by name or keyword, then filter by category and city to find the right fit.
          </p>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search vendors, services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
                data-testid="directory-search-input"
              />
            </div>

            <Select
              value={vendorId || 'all'}
              onValueChange={(val) => {
                const newVendorId = val === 'all' ? '' : val;
                const selectedVendor = vendorsInCategory.find(
                  (v) => String(v.id || v._id) === newVendorId
                );
                setVendorId(newVendorId);
                setVendorName(selectedVendor?.name || '');
                const p = new URLSearchParams(searchParams);
                if (newVendorId) {
                  p.set('vendorId', newVendorId);
                  if (selectedVendor?.name) p.set('vendorName', selectedVendor.name);
                } else {
                  p.delete('vendorId');
                  p.delete('vendorName');
                }
                setSearchParams(p);
                // Let useEffect run after state update so fetchListings uses new vendorId
              }}
            >
              <SelectTrigger className="w-full md:w-52 h-11" data-testid="vendor-filter">
                <SelectValue>{displayVendorLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendorsInCategory.map((v) => {
                  const id = String(v.id ?? v._id);
                  return (
                    <SelectItem key={id} value={id}>
                      {v.name || id}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Select
              value={category || 'all'}
              onValueChange={(val) => {
                const newCat = val === 'all' ? '' : val;
                let newVendorId = vendorId;
                let newVendorName = vendorName;
                if (newCat && vendorId) {
                  const stillInCategory = vendors.some(
                    (v) =>
                      String(v.id || v._id) === String(vendorId) &&
                      String(v.category) === String(newCat)
                  );
                  if (!stillInCategory) {
                    newVendorId = '';
                    newVendorName = '';
                    setVendorId('');
                    setVendorName('');
                  }
                }
                setCategory(newCat);
                const p = new URLSearchParams(searchParams);
                if (newCat) p.set('category', newCat);
                else p.delete('category');
                if (newVendorId) {
                  p.set('vendorId', newVendorId);
                  if (newVendorName) p.set('vendorName', newVendorName);
                } else {
                  p.delete('vendorId');
                  p.delete('vendorName');
                }
                setSearchParams(p);
                // Let useEffect run after state update so fetchListings uses correct filters
              }}
            >
              <SelectTrigger className="w-full md:w-52 h-11" data-testid="category-filter">
                <SelectValue>{displayCategoryLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} className="text-left" value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={city || 'all'}
              onValueChange={(val) => {
                const newCity = val === 'all' ? '' : val;
                setCity(newCity);
                const p = new URLSearchParams(searchParams);
                if (newCity) p.set('city', newCity);
                else p.delete('city');
                setSearchParams(p);
              }}
            >
              <SelectTrigger className="w-full md:w-44 h-11" data-testid="city-filter">
                <SelectValue>{displayCityLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit" className="bg-spruce-700 hover:bg-spruce-800 text-white h-11" data-testid="directory-search-btn">
              <Search className="w-4 h-4 mr-2" /> Search
            </Button>
          </form>

          {activeFilters > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {search && <span className="text-xs bg-slate-100 px-2 py-1 rounded">{search}</span>}
              {categoryName && <span className="text-xs bg-spruce-50 text-spruce-700 px-2 py-1 rounded">{categoryName}</span>}
              {city && <span className="text-xs bg-secondary-50 text-secondary-700 px-2 py-1 rounded">{city}</span>}
              {(vendorName || vendorId) && (
                <span className="text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded">
                  Vendor: {vendorName || `#${vendorId}`}
                </span>
              )}
              <button onClick={clearFilters} className="text-xs text-destructive flex items-center gap-1 ml-2" data-testid="clear-filters-btn">
                <X className="w-3 h-3" /> Clear all
              </button>
            </div>
          )}
        </div>

        {/* Listings Grid — from listings table filtered by categoryId */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-spruce-700" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24 px-4" data-testid="no-listings-message">
            <div className="max-w-md mx-auto">
              <p className="text-lg text-slate-600 mb-2">No listings found for your search.</p>
              <p className="text-slate-500 mb-6">
                Try clearing filters, choosing a different category or city, or browse all listings.
              </p>
              <Button variant="outline" onClick={clearFilters} className="bg-white">
                Clear filters & show all
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8" data-testid="listings-grid">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12" data-testid="pagination">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => fetchListings(page - 1)}
                  data-testid="prev-page-btn"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {page} of {pages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= pages}
                  onClick={() => fetchListings(page + 1)}
                  data-testid="next-page-btn"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}