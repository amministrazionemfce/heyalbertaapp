import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import ListingCard from '../components/ListingCard';
import PriceRangeFilter, { PRICE_SLIDER_MAX } from '../components/PriceRangeFilter';
import { listingAPI, vendorAPI } from '../lib/api';
import { CATEGORIES, CITIES } from '../data/categories';
import { readFavoriteIds } from '../lib/listingFavorites';
import { Search, X, Loader2, SlidersHorizontal, Star, Heart } from 'lucide-react';

function parsePriceFromParams(searchParams, key, fallback) {
  const raw = searchParams.get(key);
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export default function DirectoryPage() {
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
  const [featured, setFeatured] = useState(searchParams.get('featured') === 'true');
  const [myLikings, setMyLikings] = useState(searchParams.get('myLikings') === 'true');
  const [priceMin, setPriceMin] = useState(() => parsePriceFromParams(searchParams, 'minPrice', 0));
  const [priceMax, setPriceMax] = useState(() => {
    const maxParam = searchParams.get('maxPrice');
    const maxP =
      maxParam != null && maxParam !== '' && Number.isFinite(Number(maxParam))
        ? Math.min(Math.max(0, Number(maxParam)), PRICE_SLIDER_MAX)
        : PRICE_SLIDER_MAX;
    return maxP;
  });
  const [vendors, setVendors] = useState([]);
  const [priceMinDraft, setPriceMinDraft] = useState(() =>
    String(parsePriceFromParams(searchParams, 'minPrice', 0))
  );
  const [priceMaxDraft, setPriceMaxDraft] = useState(() => {
    const maxParam = searchParams.get('maxPrice');
    const maxP =
      maxParam != null && maxParam !== '' && Number.isFinite(Number(maxParam))
        ? Math.min(Math.max(0, Number(maxParam)), PRICE_SLIDER_MAX)
        : PRICE_SLIDER_MAX;
    return String(maxP);
  });

  const priceFilterActive = priceMin > 0 || priceMax < PRICE_SLIDER_MAX;

  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const fetchListings = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const params = { page: p, limit: 12 };
        const s = searchRef.current;
        if (s) params.search = s;
        if (category) params.categoryId = category;
        if (city) params.city = city;
        if (vendorId) params.vendorId = vendorId;
        if (featured) params.featured = true;
        if (myLikings) {
          const favIds = readFavoriteIds();
          if (favIds.length === 0) {
            setListings([]);
            setTotal(0);
            setPages(1);
            setPage(p);
            setLoading(false);
            return;
          }
          params.myLikings = true;
          params.favoriteIds = favIds.join(',');
        }
        if (priceFilterActive) {
          params.minPrice = priceMin;
          params.maxPrice = priceMax;
        }

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
    },
    [
      category,
      city,
      vendorId,
      featured,
      myLikings,
      priceMin,
      priceMax,
      priceFilterActive,
      setSearchParams,
    ]
  );

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setCategory(searchParams.get('category') || '');
    setCity(searchParams.get('city') || '');
    setVendorId(searchParams.get('vendorId') || '');
    setVendorName(searchParams.get('vendorName') || '');
    setFeatured(searchParams.get('featured') === 'true');
    setMyLikings(searchParams.get('myLikings') === 'true');
    const minP = Math.min(Math.max(0, parsePriceFromParams(searchParams, 'minPrice', 0)), PRICE_SLIDER_MAX);
    setPriceMin(minP);
    const maxParam = searchParams.get('maxPrice');
    const maxP =
      maxParam != null && maxParam !== '' && Number.isFinite(Number(maxParam))
        ? Math.min(Math.max(0, Number(maxParam)), PRICE_SLIDER_MAX)
        : PRICE_SLIDER_MAX;
    setPriceMax(maxP);
    setPriceMinDraft(String(minP));
    setPriceMaxDraft(String(maxP));
  }, [searchParams]);

  useEffect(() => {
    fetchListings(1);
  }, [category, city, vendorId, featured, myLikings, priceMin, priceMax, fetchListings]);

  useEffect(() => {
    const loadVendors = async () => {
      try {
        const res = await vendorAPI.list({ limit: 100 });
        const list = Array.isArray(res.data) ? res.data : res.data?.vendors || [];
        setVendors(list);
      } catch {
        setVendors([]);
      }
    };
    loadVendors();
  }, []);

  useEffect(() => {
    if (vendorId && !vendorName && vendors.length > 0) {
      const v = vendors.find((x) => String(x.id || x._id) === String(vendorId));
      if (v?.name) setVendorName(v.name);
    }
  }, [vendorId, vendorName, vendors]);

  const handleSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (search) next.set('search', search);
    if (category) next.set('category', category);
    if (city) next.set('city', city);
    if (vendorId) {
      next.set('vendorId', vendorId);
      if (vendorName) next.set('vendorName', vendorName);
    }
    if (featured) next.set('featured', 'true');
    if (myLikings) next.set('myLikings', 'true');
    if (priceFilterActive) {
      next.set('minPrice', String(priceMin));
      next.set('maxPrice', String(priceMax));
    }
    setSearchParams(next);
    fetchListings(1);
  };

  const clearFilters = () => {
    searchRef.current = '';
    setSearch('');
    setCategory('');
    setCity('');
    setVendorId('');
    setVendorName('');
    setFeatured(false);
    setMyLikings(false);
    setPriceMin(0);
    setPriceMax(PRICE_SLIDER_MAX);
    setPriceMinDraft('0');
    setPriceMaxDraft(String(PRICE_SLIDER_MAX));
    setSearchParams({});
    fetchListings(1);
  };

  const setFeaturedChecked = (checked) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (checked) next.set('featured', 'true');
      else next.delete('featured');
      return next;
    });
  };

  const setMyLikingsChecked = (checked) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (checked) next.set('myLikings', 'true');
      else next.delete('myLikings');
      return next;
    });
  };

  const handlePriceRangeChange = ({ min, max }) => {
    setPriceMin(min);
    setPriceMax(max);
    setPriceMinDraft(String(min));
    setPriceMaxDraft(String(max));
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const active = min > 0 || max < PRICE_SLIDER_MAX;
      if (active) {
        next.set('minPrice', String(min));
        next.set('maxPrice', String(max));
      } else {
        next.delete('minPrice');
        next.delete('maxPrice');
      }
      return next;
    });
  };

  const commitPriceMinInput = () => {
    const raw = priceMinDraft.trim();
    let v = raw === '' ? 0 : parseInt(raw, 10);
    if (!Number.isFinite(v)) v = 0;
    v = Math.max(0, Math.min(v, PRICE_SLIDER_MAX));
    let maxVal = priceMax;
    if (v > maxVal) maxVal = v;
    handlePriceRangeChange({ min: v, max: maxVal });
  };

  const commitPriceMaxInput = () => {
    const raw = priceMaxDraft.trim();
    let v = raw === '' ? PRICE_SLIDER_MAX : parseInt(raw, 10);
    if (!Number.isFinite(v)) v = PRICE_SLIDER_MAX;
    v = Math.max(0, Math.min(v, PRICE_SLIDER_MAX));
    let minVal = priceMin;
    if (v < minVal) minVal = v;
    handlePriceRangeChange({ min: minVal, max: v });
  };

  const activeFilters =
    [search, category, city, vendorName || vendorId].filter(Boolean).length +
    (featured ? 1 : 0) +
    (myLikings ? 1 : 0) +
    (priceFilterActive ? 1 : 0);

  const categoryName = CATEGORIES.find((c) => c.id === category)?.name;
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
      <div className="container mx-auto px-4 md:px-8 max-w-7xl py-8 md:py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 lg:items-start">
          <aside
            className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-24 space-y-4"
            aria-label="Search and filters"
          >
            <div
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-visible"
              data-testid="search-filter-bar"
            >
              <div className="px-5 pt-5 pb-3 border-b border-slate-100 bg-gradient-to-br from-slate-50/80 to-white">
                <div className="flex items-center gap-2 text-spruce-800">
                  <SlidersHorizontal className="w-4 h-4" aria-hidden />
                  <h2 className="font-heading text-lg font-semibold tracking-tight">Filters</h2>
                </div>
                <p className="text-sm text-slate-500 mt-1">Refine by keyword, price, and more.</p>
              </div>
              <form onSubmit={handleSearch} className="p-5 space-y-4">
                {activeFilters > 0 && (
                  <div className="pb-1 border-b border-slate-100 space-y-2 mb-1">
                    <p className="text-xs font-medium text-slate-500">Active filters</p>
                    <div className="flex flex-wrap gap-1.5">
                      {search && (
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">{search}</span>
                      )}
                      {categoryName && (
                        <span className="text-xs bg-spruce-50 text-spruce-800 px-2 py-1 rounded-md">
                          {categoryName}
                        </span>
                      )}
                      {city && (
                        <span className="text-xs bg-secondary-50 text-secondary-800 px-2 py-1 rounded-md">
                          {city}
                        </span>
                      )}
                      {(vendorName || vendorId) && (
                        <span className="text-xs bg-amber-50 text-amber-900 px-2 py-1 rounded-md">
                          {vendorName || `#${vendorId}`}
                        </span>
                      )}
                      {featured && (
                        <span className="text-xs bg-amber-100 text-amber-900 px-2 py-1 rounded-md">Featured</span>
                      )}
                      {myLikings && (
                        <span className="text-xs bg-rose-50 text-rose-900 px-2 py-1 rounded-md">My likings</span>
                      )}
                      {priceFilterActive && (
                        <span className="text-xs bg-indigo-50 text-indigo-900 px-2 py-1 rounded-md">
                          ${priceMin} – ${priceMax}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-xs text-destructive flex items-center gap-1 hover:underline"
                      data-testid="clear-filters-btn"
                    >
                      <X className="w-3 h-3" /> Clear all
                    </button>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="directory-search-input" className="text-xs font-medium text-slate-600">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="directory-search-input"
                      placeholder="Keywords, services…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 h-11 bg-slate-50/80 border-slate-200"
                      data-testid="directory-search-input"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 p-3 space-y-3">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Quick filters</p>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeaturedChecked(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-spruce-700 focus:ring-spruce-600"
                      data-testid="filter-featured"
                    />
                    <span className="flex items-center gap-2 text-sm text-slate-700">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400" aria-hidden />
                      Featured only
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={myLikings}
                      onChange={(e) => setMyLikingsChecked(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-spruce-700 focus:ring-spruce-600"
                      data-testid="filter-my-likings"
                    />
                    <span className="flex items-center gap-2 text-sm text-slate-700">
                      <Heart className="w-4 h-4 text-rose-500" aria-hidden />
                      My likings
                    </span>
                  </label>
                </div>

                <div className="space-y-3 pt-1">
                  <p className="text-sm font-medium text-slate-800">Price</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="price-min-input" className="text-xs font-medium text-slate-600">
                        Min ($)
                      </label>
                      <Input
                        id="price-min-input"
                        type="number"
                        min={0}
                        max={PRICE_SLIDER_MAX}
                        step={50}
                        value={priceMinDraft}
                        onChange={(e) => setPriceMinDraft(e.target.value)}
                        onBlur={commitPriceMinInput}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.currentTarget.blur();
                          }
                        }}
                        className="h-10 bg-white border-slate-200 tabular-nums"
                        data-testid="price-min-input"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="price-max-input" className="text-xs font-medium text-slate-600">
                        Max ($)
                      </label>
                      <Input
                        id="price-max-input"
                        type="number"
                        min={0}
                        max={PRICE_SLIDER_MAX}
                        step={50}
                        value={priceMaxDraft}
                        onChange={(e) => setPriceMaxDraft(e.target.value)}
                        onBlur={commitPriceMaxInput}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.currentTarget.blur();
                          }
                        }}
                        className="h-10 bg-white border-slate-200 tabular-nums"
                        data-testid="price-max-input"
                      />
                    </div>
                  </div>

                  <PriceRangeFilter
                    min={priceMin}
                    max={priceMax}
                    rangeMax={PRICE_SLIDER_MAX}
                    onChange={handlePriceRangeChange}
                    hideValueSummary
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-600">Vendor</span>
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
                    }}
                  >
                    <SelectTrigger className="w-full h-11 bg-white" data-testid="vendor-filter">
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
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-600">Category</span>
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
                    }}
                  >
                    <SelectTrigger className="w-full h-11 bg-white" data-testid="category-filter">
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
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-600">City</span>
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
                    <SelectTrigger className="w-full h-11 bg-white" data-testid="city-filter">
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
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white h-11"
                  data-testid="directory-search-btn"
                >
                  <Search className="w-4 h-4 mr-2" /> Apply filters
                </Button>
              </form>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <header className="mb-2 md:mb-3">
              <p className="text-slate-500 mt-1 text-sm md:text-base">
                {!loading && total > 0
                  ? `${total} result${total === 1 ? '' : 's'}`
                  : !loading
                    ? 'No results yet — adjust filters or search.'
                    : 'Loading…'}
              </p>
            </header>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-spruce-700" />
              </div>
            ) : listings.length === 0 ? (
              <div
                className="text-center py-20 px-4 rounded-2xl border border-dashed border-slate-200 bg-white/60"
                data-testid="no-listings-message"
              >
                <div className="max-w-md mx-auto">
                  <p className="text-lg text-slate-600 mb-2">No listings match your filters.</p>
                  <p className="text-slate-500 mb-6 text-sm">
                    Try clearing filters or searching with different keywords.
                  </p>
                  <Button variant="outline" onClick={clearFilters} className="bg-white">
                    Clear filters & show all
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8"
                  data-testid="listings-grid"
                >
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>

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
      </div>
    </div>
  );
}
