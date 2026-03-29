import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listingAPI } from '../lib/api';
import { CATEGORIES } from '../data/categories';
import { ROUTES, directoryCategoryQuery } from '../constants';
import CategoryScrollTabs from './CategoryScrollTabs';
import FeaturedListingCard from './FeaturedListingCard';

const PAGE_SIZE = 12;

const tabItems = [{ id: '', label: 'All' }, ...CATEGORIES.map((c) => ({ id: c.id, label: c.name }))];

/**
 * Featured listings grid with category tabs + horizontal scroll arrows.
 */
export default function FeaturedListingsSection() {
  const [categoryId, setCategoryId] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        featured: true,
        limit: PAGE_SIZE,
        page: 1,
      };
      if (categoryId) params.categoryId = categoryId;
      const res = await listingAPI.directory(params);
      setListings(res.data?.listings ?? []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not load listings');
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  const viewMoreHref = categoryId ? directoryCategoryQuery(categoryId) : ROUTES.LISTINGS;

  return (
    <section
      className="border-t border-slate-200/80 bg-slate-50 py-16 md:py-24"
      data-testid="featured-listings-section"
    >
      <div className="container mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-10 text-center md:mb-12">
          <h2 className="font-heading text-3xl font-bold text-slate-900 md:text-4xl">Featured Listings</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 md:text-lg">
            Hand-picked services from verified vendors across Alberta.
          </p>
        </div>

        <div className="mb-10 md:mb-12">
          <CategoryScrollTabs items={tabItems} value={categoryId} onChange={setCategoryId} />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 sm:gap-5">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-slate-100"
              >
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="space-y-3 p-4">
                  <div className="h-4 rounded bg-slate-200" />
                  <div className="h-3 w-2/3 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-sm text-red-600">{error}</p>
        ) : listings.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-14 text-center text-slate-600">
            No featured listings in this category yet. Try another category or browse the full directory.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:gap-5">
            {listings.map((listing) => (
              <FeaturedListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Link
            to={viewMoreHref}
            className="inline-flex min-w-[200px] items-center justify-center rounded-full border-2 border-spruce-800 bg-white px-10 py-3 text-sm font-semibold text-spruce-900 shadow-sm transition hover:bg-spruce-900 hover:text-white"
            data-testid="featured-listings-view-more"
          >
            View more
          </Link>
        </div>
      </div>
    </section>
  );
}
