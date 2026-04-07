import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import ListingCard from '../components/ListingCard';
import { listingAPI } from '../lib/api';
import { CATEGORIES, CITIES } from '../data/categories';
import { readFavoriteIds } from '../lib/listingFavorites';
import {
  Search,
  X,
  SlidersHorizontal,
  Star,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowDownUp,
} from 'lucide-react';
import { DirectoryListingsGridSkeleton } from '../components/ListingPageSkeletons';
import { Skeleton } from '../components/ui/skeleton';

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

function parsePageSizeFromParams(searchParams) {
  const n = Number.parseInt(searchParams.get('perPage') || String(DEFAULT_PAGE_SIZE), 10);
  return PAGE_SIZE_OPTIONS.includes(n) ? n : DEFAULT_PAGE_SIZE;
}

/** Compact page list with ellipses for large page counts */
function buildPageList(current, total) {
  if (total <= 1) return [];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items = [];
  const push = (v) => items.push(v);
  push(1);
  let left = Math.max(2, current - 1);
  let right = Math.min(total - 1, current + 1);
  if (current <= 3) {
    left = 2;
    right = Math.min(5, total - 1);
  }
  if (current >= total - 2) {
    left = Math.max(2, total - 4);
    right = total - 1;
  }
  if (left > 2) push('…');
  for (let p = left; p <= right; p += 1) push(p);
  if (right < total - 1) push('…');
  push(total);
  return items;
}

function DirectoryListingPagination({
  page,
  pages,
  total,
  pageSize,
  listingsOnPage,
  disabled,
  onPageChange,
  onPerPageChange,
}) {
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : (page - 1) * pageSize + listingsOnPage;
  const pageItems = buildPageList(page, pages);

  return (
    <div
      className="font-ui mt-3 flex w-full min-w-0 flex-col gap-3 pt-2 text-sm lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-x-4"
      data-testid="directory-pagination"
    >
      <div className="flex w-full min-w-0 items-center justify-between gap-3 lg:w-auto lg:justify-start lg:gap-6">
        <p className="min-w-0 shrink tabular-nums text-slate-600">
          {total === 0 ? (
            <span>No listings to show</span>
          ) : (
            <>
              Showing <span className="font-semibold text-slate-900">{rangeStart}</span>
              {'–'}
              <span className="font-semibold text-slate-900">{rangeEnd}</span> of{' '}
              <span className="font-semibold text-slate-900">{total}</span>
            </>
          )}
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <span className="whitespace-nowrap text-slate-500">Per page</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => onPerPageChange(Number.parseInt(e.target.value, 10))}
              disabled={disabled}
              className="font-ui h-8 w-[4.25rem] cursor-pointer appearance-none rounded-md border border-slate-200 bg-white py-0 pl-2 pr-7 text-sm tabular-nums text-slate-900 shadow-sm focus:border-spruce-600 focus:outline-none focus:ring-1 focus:ring-spruce-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="per-page-select"
              aria-label="Results per page"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
              aria-hidden
            />
          </div>
        </div>
      </div>

      {pages > 1 ? (
        <nav
          className="flex w-full min-w-0 flex-wrap items-center justify-center gap-0.5 lg:w-auto lg:justify-end lg:border-l lg:border-slate-200 lg:pl-4"
          aria-label="Pagination"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="font-ui h-8 gap-0.5 px-2 text-xs sm:px-2.5"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
            data-testid="prev-page-btn"
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:mr-0.5" aria-hidden />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <div className="flex items-center gap-0.5 px-0.5">
            {pageItems.map((item, idx) =>
              item === '…' ? (
                <span
                  key={`e-${idx}`}
                  className="flex h-8 min-w-[1.75rem] items-center justify-center px-0.5 text-slate-400"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  type="button"
                  variant={item === page ? 'default' : 'outline'}
                  size="sm"
                  className={
                    item === page
                      ? 'font-ui h-8 min-w-[2rem] bg-spruce-800 px-1.5 text-xs text-white hover:bg-spruce-900'
                      : 'font-ui h-8 min-w-[2rem] px-1.5 text-xs'
                  }
                  disabled={disabled}
                  onClick={() => onPageChange(item)}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? 'page' : undefined}
                  data-testid={`page-btn-${item}`}
                >
                  {item}
                </Button>
              )
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="font-ui h-8 gap-0.5 px-2 text-xs sm:px-2.5"
            disabled={disabled || page >= pages}
            onClick={() => onPageChange(page + 1)}
            data-testid="next-page-btn"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3.5 w-3.5 sm:ml-0.5" aria-hidden />
          </Button>
        </nav>
      ) : null}
    </div>
  );
}

export default function DirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const directoryFetchSeqRef = useRef(0);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const initialSeller =
    searchParams.get('userId') || searchParams.get('vendorId') || '';
  const [sellerUserId, setSellerUserId] = useState(initialSeller);
  const [sellerName, setSellerName] = useState(searchParams.get('vendorName') || searchParams.get('sellerName') || '');
  const [featured, setFeatured] = useState(searchParams.get('featured') === 'true');
  const [myLikings, setMyLikings] = useState(searchParams.get('myLikings') === 'true');
  /** When URL has userId but no display name, resolve label from first listing title. */
  const [sellerResolvedName, setSellerResolvedName] = useState('');

  const pageSize = useMemo(() => parsePageSizeFromParams(searchParams), [searchParams]);

  const reviewSort = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const v = (sp.get('reviewSort') || sp.get('review_sort') || '').trim().toLowerCase();
    if (v === 'least') return 'least';
    if (v === 'most') return 'most';
    return null;
  }, [location.search]);

  const [debouncedSearch, setDebouncedSearch] = useState(() => (searchParams.get('search') || '').trim());

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [search]);

  const fetchListings = useCallback(
    async (p = 1, opts = {}) => {
      const sortForRequest = Object.prototype.hasOwnProperty.call(opts, 'reviewSort')
        ? opts.reviewSort
        : reviewSort;

      const mySeq = ++directoryFetchSeqRef.current;
      setLoading(true);
      try {
        const params = { page: p, limit: pageSize };
        if (debouncedSearch) params.search = debouncedSearch;
        if (category) params.categoryId = category;
        if (city) params.city = city;
        if (sellerUserId) params.userId = sellerUserId;
        if (featured) params.featured = true;
        if (myLikings) {
          const favIds = readFavoriteIds();
          if (favIds.length === 0) {
            if (mySeq !== directoryFetchSeqRef.current) return;
            setListings([]);
            setTotal(0);
            setPages(1);
            setPage(p);
            return;
          }
          params.myLikings = true;
          params.favoriteIds = favIds.join(',');
        }
        const dirHeaders = {};
        if (sortForRequest === 'most') {
          params.reviewSort = 'most';
          params.review_sort = 'most';
          dirHeaders['X-Directory-Review-Sort'] = 'most';
        } else if (sortForRequest === 'least') {
          params.reviewSort = 'least';
          params.review_sort = 'least';
          dirHeaders['X-Directory-Review-Sort'] = 'least';
        }

        const res = await listingAPI.directory(params, { headers: dirHeaders });
        if (mySeq !== directoryFetchSeqRef.current) return;
        setListings(res.data.listings || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
        setPage(res.data.page ?? p);
      } catch {
        if (mySeq !== directoryFetchSeqRef.current) return;
        setListings([]);
      } finally {
        if (mySeq === directoryFetchSeqRef.current) setLoading(false);
      }
    },
    [
      debouncedSearch,
      category,
      city,
      sellerUserId,
      featured,
      myLikings,
      pageSize,
      reviewSort,
    ]
  );

  const searchParamFromUrl = searchParams.get('search') ?? '';
  useEffect(() => {
    setSearch(searchParamFromUrl);
    setDebouncedSearch(searchParamFromUrl.trim());
  }, [searchParamFromUrl]);

  useEffect(() => {
    setCategory(searchParams.get('category') || '');
    setCity(searchParams.get('city') || '');
    setSellerUserId(searchParams.get('userId') || searchParams.get('vendorId') || '');
    setSellerName(searchParams.get('vendorName') || searchParams.get('sellerName') || '');
    setFeatured(searchParams.get('featured') === 'true');
    setMyLikings(searchParams.get('myLikings') === 'true');
  }, [searchParams]);

  useEffect(() => {
    fetchListings(1);
  }, [
    debouncedSearch,
    category,
    city,
    sellerUserId,
    featured,
    myLikings,
    pageSize,
    reviewSort,
    fetchListings,
  ]);

  useEffect(() => {
    if (!sellerUserId) {
      setSellerResolvedName('');
      return;
    }
    if (sellerName) {
      setSellerResolvedName('');
      return;
    }
    let cancelled = false;
    listingAPI
      .directory({ userId: sellerUserId, limit: 1, page: 1 })
      .then((res) => {
        const first = (res.data?.listings || [])[0];
        if (!cancelled) setSellerResolvedName(String(first?.title || '').trim());
      })
      .catch(() => {
        if (!cancelled) setSellerResolvedName('');
      });
    return () => {
      cancelled = true;
    };
  }, [sellerUserId, sellerName]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    setDebouncedSearch(q);
    const next = new URLSearchParams();
    if (q) next.set('search', q);
    if (category) next.set('category', category);
    if (city) next.set('city', city);
    if (sellerUserId) {
      next.set('userId', sellerUserId);
      if (sellerName) next.set('sellerName', sellerName);
    }
    if (featured) next.set('featured', 'true');
    if (myLikings) next.set('myLikings', 'true');
    if (pageSize !== DEFAULT_PAGE_SIZE) next.set('perPage', String(pageSize));
    const rs = (searchParams.get('reviewSort') || searchParams.get('review_sort') || '')
      .trim()
      .toLowerCase();
    if (rs === 'most' || rs === 'least') next.set('reviewSort', rs);
    setSearchParams(next);
  };

  /** @param {null | 'most' | 'least'} mode */
  const applyReviewSort = (mode) => {
    const next = new URLSearchParams(location.search);
    next.delete('review_sort');
    if (mode === 'most') next.set('reviewSort', 'most');
    else if (mode === 'least') next.set('reviewSort', 'least');
    else next.delete('reviewSort');
    const q = next.toString();
    navigate({ pathname: location.pathname, search: q ? `?${q}` : '' }, { replace: false });
    void fetchListings(1, { reviewSort: mode });
  };

  const handlePerPageChange = (n) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (n === DEFAULT_PAGE_SIZE) next.delete('perPage');
      else next.set('perPage', String(n));
      return next;
    });
  };

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCategory('');
    setCity('');
    setSellerUserId('');
    setSellerName('');
    setFeatured(false);
    setMyLikings(false);
    setSearchParams({});
    // Do not call fetchListings here: this closure still sees the previous filter state (e.g. featured),
    // so an in-flight request can finish after the effect-driven fetch and overwrite results.
    // Clearing URL + state lets the effects below run a single fetch with the reset filters.
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

  const activeFilters =
    [search, category, city, sellerName || sellerResolvedName || sellerUserId].filter(Boolean)
      .length +
    (featured ? 1 : 0) +
    (myLikings ? 1 : 0);

  const categoryName = CATEGORIES.find((c) => c.id === category)?.name;
  const displayCategoryLabel = categoryName || 'All Categories';
  const displayCityLabel = city || 'All Cities';

  return (
    <div className="min-h-screen" data-testid="directory-page">
      <div className="w-full px-4 py-1 sm:px-5 md:px-6 md:py-5 lg:px-8 xl:px-10">
        <div className="flex flex-col lg:flex-row lg:gap-8 xl:gap-10 lg:items-start">
          <aside
            className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-24 space-y-4"
            aria-label="Search and filters"
          >
            <div
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-visible"
              data-testid="search-filter-bar"
            >
              <div className="px-5 pt-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" aria-hidden />
                  <h2 className="font-heading text-lg tracking-tight">Filters</h2>
                </div>
              </div>
              <form onSubmit={handleSearch} className="p-5 space-y-4">
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
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-600">Category</span>
                  <Select
                    value={category || 'all'}
                    onValueChange={(val) => {
                      const newCat = val === 'all' ? '' : val;
                      setCategory(newCat);
                      setSellerUserId('');
                      setSellerName('');
                      setSellerResolvedName('');
                      const p = new URLSearchParams(searchParams);
                      if (newCat) p.set('category', newCat);
                      else p.delete('category');
                      p.delete('userId');
                      p.delete('vendorId');
                      p.delete('vendorName');
                      p.delete('sellerName');
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
                      <ThumbsUp className="w-4 h-4 text-spruce-600" aria-hidden />
                      My likings
                    </span>
                  </label>
                </div>

              </form>
            </div>
          </aside>

          <div className="flex min-h-[calc(100dvh-10rem)] min-w-0 flex-1 flex-col lg:min-w-0 mt-2 md:mt-0">
            {loading ? (
              <div className="min-h-[42vh] py-2" role="status" aria-live="polite" aria-busy="true" aria-label="Loading listings">
                <div className="mb-4 space-y-2">
                  <Skeleton className="h-7 w-48 rounded-lg" />
                  <Skeleton className="h-4 w-64 max-w-full rounded" />
                </div>
                <DirectoryListingsGridSkeleton count={pageSize} />
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col mt-3">
                <div className="mb-4 flex w-full flex-col gap-3 sm:flex-row sm:items-stretch">
                  <div className="w-full min-w-0 sm:w-1/2 flex flex-col justify-center sm:max-w-[50%]">
                    {activeFilters > 0 ? (
                      <div
                        className="w-full rounded-xl border border-slate-200/90 bg-white p-2 shadow-sm"
                        data-testid="directory-active-filters"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                            {search && (
                              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">{search}</span>
                            )}
                            {categoryName && (
                              <span className="rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-800">
                                {categoryName}
                              </span>
                            )}
                            {city && (
                              <span className="rounded-md bg-secondary-50 px-2 py-1 text-xs text-secondary-800">
                                {city}
                              </span>
                            )}
                            {sellerUserId && (
                              <span className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-900">
                                {sellerName || sellerResolvedName || `Seller #${sellerUserId}`}
                              </span>
                            )}
                            {featured && (
                              <span className="rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-900">Featured</span>
                            )}
                            {myLikings && (
                              <span className="rounded-md bg-spruce-50 px-2 py-1 text-xs text-spruce-900">My likings</span>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
                         
                            <button
                              type="button"
                              onClick={clearFilters}
                              className="font-ui inline-flex shrink-0 items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                              data-testid="clear-filters-btn"
                            >
                              <X className="h-3.5 w-3.5" aria-hidden /> Clear all
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <header className="pr-2" data-testid="directory-results-bar">
                        <h2 className="font-heading text-sm text-slate-900 md:text-lg">
                          {total > 0
                            ? `${total} result${total === 1 ? '' : 's'}`
                            : 'No results match your filters'}
                        </h2>
                      </header>
                    )}
                  </div>
                  <div className="flex w-full items-center justify-start sm:w-1/2 sm:justify-end sm:pl-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 min-w-[10.5rem] justify-between gap-2 border-slate-200 bg-white px-3 hover:bg-white sm:min-w-[11.5rem]"
                          data-testid="directory-review-sort-btn"
                          aria-label="Sort listings by review count"
                          aria-haspopup="menu"
                        >
                          <span className="flex min-w-0 flex-1 items-center gap-2">
                            <ArrowDownUp className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
                            <span className="truncate text-sm font-medium text-slate-900">
                              {reviewSort === 'most'
                                ? 'Most reviews'
                                : reviewSort === 'least'
                                  ? 'Least reviews'
                                  : 'No sort'}
                            </span>
                          </span>
                          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[12rem] py-1" role="menu">
                        <DropdownMenuItem
                          variant={reviewSort == null ? 'highlight' : 'default'}
                          onClick={() => applyReviewSort(null)}
                          data-testid="directory-review-sort-none"
                        >
                          No sort
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant={reviewSort === 'most' ? 'highlight' : 'default'}
                          onClick={() => applyReviewSort('most')}
                          data-testid="directory-review-sort-most"
                        >
                          Most reviews
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant={reviewSort === 'least' ? 'highlight' : 'default'}
                          onClick={() => applyReviewSort('least')}
                          data-testid="directory-review-sort-least"
                        >
                          Least reviews
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                  {listings.length === 0 ? (
                    <div
                      className="flex w-full flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-12 text-center min-h-[min(70dvh,calc(100dvh-14rem))]"
                      data-testid="no-listings-message"
                    >
                      <div className="mx-auto max-w-md">
                        <p className="mb-2 text-lg text-slate-600">No listings match your filters.</p>
                        <p className="mb-6 text-sm text-slate-500">
                          Adjust filters or clear them to see more results.
                        </p>
                        <Button variant="outline" onClick={clearFilters} className="bg-white">
                          Clear filters & show all
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 md:gap-6 lg:gap-7"
                      data-testid="listings-grid"
                    >
                      {listings.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                      ))}
                    </div>
                  )}
                </div>

                <DirectoryListingPagination
                  page={page}
                  pages={Math.max(pages, 1)}
                  total={total}
                  pageSize={pageSize}
                  listingsOnPage={listings.length}
                  disabled={loading}
                  onPageChange={fetchListings}
                  onPerPageChange={handlePerPageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
