import { useEffect, useMemo, useState } from 'react';
import { Filter, Search, Star } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import VendorCard from '../components/VendorCard';
import { CATEGORIES, CITIES, TIERS } from '../data/categories';
import { vendorAPI } from '../lib/api';

export default function VendorsPage() {
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [tier, setTier] = useState('');
  const [sort, setSort] = useState('newest');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await vendorAPI.list({
          limit: 200,
          q: search || undefined,
          city: city || undefined,
          category: category || undefined,
          tier: tier || undefined,
          featured: featuredOnly || undefined,
          sort,
        });
        if (!alive) return;
        setVendors(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!alive) return;
        setVendors([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [search, city, category, tier, featuredOnly, sort]);

  const normalizedVendors = useMemo(
    () =>
      vendors.map((v) => ({
        ...v,
        avg_rating: v.avg_rating ?? v.avgRating ?? 0,
        review_count: v.review_count ?? v.reviewCount ?? 0,
      })),
    [vendors]
  );

  const clearFilters = () => {
    setSearch('');
    setCity('');
    setCategory('');
    setTier('');
    setSort('newest');
    setFeaturedOnly(false);
  };

  const filterCount = [search, city, category, tier, featuredOnly].filter(Boolean).length;

  return (
    <div className="bg-slate-50 min-h-screen" data-testid="vendors-page">
      <div className="container mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-10">
    

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm h-fit lg:sticky lg:top-24">
            <div className="mb-4 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-slate-800 font-semibold">
                <Filter className="h-4 w-4 text-spruce-700" />
                Filters
              </div>
              {filterCount > 0 && (
                <Button type="button" variant="ghost" className="h-8 px-2 text-xs" onClick={clearFilters}>
                  Clear all
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Business name or keyword"
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-spruce-500/20 focus:border-spruce-300"
                >
                  <option value="">All cities</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-spruce-500/20 focus:border-spruce-300"
                >
                  <option value="">All categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tier</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-spruce-500/20 focus:border-spruce-300"
                >
                  <option value="">All tiers</option>
                  {TIERS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Sort</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-spruce-500/20 focus:border-spruce-300"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="name_asc">Name A-Z</option>
                  <option value="name_desc">Name Z-A</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => setFeaturedOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-spruce-700 focus:ring-spruce-500"
                />
                Featured vendors only
              </label>
            </div>
          </aside>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-600">
                {loading ? 'Loading vendors...' : `${normalizedVendors.length} vendor${normalizedVendors.length === 1 ? '' : 's'} found`}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                Active Alberta businesses
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white">
                    <div className="h-48 bg-slate-100" />
                    <div className="space-y-3 p-5">
                      <div className="h-5 w-2/3 rounded bg-slate-100" />
                      <div className="h-4 w-1/2 rounded bg-slate-100" />
                      <div className="h-4 w-full rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : normalizedVendors.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
                No vendors match your current filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {normalizedVendors.map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} showTierBadge={false} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
