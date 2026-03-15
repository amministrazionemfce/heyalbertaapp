import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import VendorCard from '../components/VendorCard';
import { StarRating } from '../components/StarRating';
import { vendorAPI, listingAPI } from '../lib/api';
import { CATEGORIES, getCategoryIcon, CITIES } from '../data/categories';
import {
  Search, ArrowRight, BadgeCheck, Users, BookOpen, MapPin,
  ChevronRight, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';

const INITIAL_CATEGORIES = 8;

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredVendors, setFeaturedVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [listingCounts, setListingCounts] = useState({});
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryOrder, setCategoryOrder] = useState('listing'); // 'listing' | 'review' | 'popular'
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const set = () => setIsMobile(mq.matches);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);

  useEffect(() => {
    Promise.allSettled([
      vendorAPI.list({ featured: true, limit: 6 }).then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.vendors || []);
        setFeaturedVendors(list);
      }),
      listingAPI.countsByCategory().then(res => setListingCounts(res.data || {})),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/directory?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Filter and sort categories for Browse section
  const categoryFilterLower = categorySearch.trim().toLowerCase();
  const filteredCategories = !categoryFilterLower
    ? CATEGORIES
    : CATEGORIES.filter(
        (c) =>
          c.name.toLowerCase().includes(categoryFilterLower) ||
          (c.description && c.description.toLowerCase().includes(categoryFilterLower))
      );
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    const countA = listingCounts[a.id] ?? 0;
    const countB = listingCounts[b.id] ?? 0;
    if (categoryOrder === 'listing' || categoryOrder === 'popular') return countB - countA;
    if (categoryOrder === 'review') return (a.name || '').localeCompare(b.name || '');
    return 0;
  });
  const categoriesToShow = categoriesExpanded ? sortedCategories : sortedCategories.slice(0, INITIAL_CATEGORIES);

  return (
    <div data-testid="homepage">
      {/* Hero Section */}
      <section className="relative overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0">
          <img
            src="background.jpeg"
            alt="Alberta mountains landscape"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 to-slate-900/40" />
        </div>

        <div className="relative container mx-auto px-4 md:px-8 max-w-7xl pt-16 pb-24 md:py-36">
          <div className="max-w-3xl">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 -mt-2 md:mt-0">
              Welcome Home to <span className="text-secondary-400">Alberta</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-200 leading-relaxed mb-10 max-w-2xl">
              Discover verified local services across 16 categories. From finding your dream home to settling your family, we connect you with trusted vendors who make relocation effortless.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-3 max-w-xl" data-testid="hero-search-form">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                
                <Input
                  placeholder={isMobile ? 'Search ...' : 'Search services, vendors, or cities...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 md:pl-12 h-14 text-base bg-white/95 backdrop-blur border-0 shadow-lg rounded-xl "
                  data-testid="hero-search-input"
                />
              </div>
              <Button
                type="submit"
                className="h-14 px-4 md:px-8 bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center"
                data-testid="hero-search-btn"
              >
                <Search className="w-5 h-5 md:mr-2 shrink-0" aria-hidden />
                <span className="hidden md:inline">Search</span>
              </Button>
            </form>

            <div className="flex items-center gap-6 mt-8 text-sm text-slate-300">
              <span className="flex items-center gap-1.5"><BadgeCheck className="w-4 h-4 text-secondary-400" /> Verified Vendors</span>
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-secondary-400" /> Free to Browse</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-secondary-400" /> Relocation Guides</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bento Grid — 8 visible, expand with Show more */}
      <section className="py-10 md:py-16 bg-white" data-testid="categories-section">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="mb-8">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-center text-slate-900 mb-8">
              Browse by Category
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="pl-9 h-10 border-slate-200 rounded-lg"
                  data-testid="category-search"
                />
              </div>
              <select
                value={categoryOrder}
                onChange={(e) => setCategoryOrder(e.target.value)}
                className="h-10 px-4 rounded-lg border bg-white border-slate-200 text-slate-700 font-medium text-sm cursor-pointer"
                data-testid="category-order"
              >
                <option value="listing">By listings</option>
                <option value="review">By review</option>
                <option value="popular">Popular</option>
              </select>

            {sortedCategories.length > INITIAL_CATEGORIES && (
              <div className="flex justify-center mb-2">
                <button
                  type="button"
                  onClick={() => setCategoriesExpanded((v) => !v)}
                  className="inline-flex items-center w-full gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  data-testid="categories-show-more"
                >
                  {categoriesExpanded ? (
                    <>
                      Show less <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Show All 16 Categories
                    </>
                  )}
                </button>
              </div>
            )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {categoriesToShow.map((cat) => {
                const Icon = getCategoryIcon(cat.icon);
                const idx = CATEGORIES.findIndex((c) => c.id === cat.id);
                const imageNum = idx >= 0 ? idx + 1 : 1;
                const imageSrc = `/services/${imageNum}.jpg`;
                const count = listingCounts[cat.id] ?? 0;
                return (
                <Link
                  key={cat.id}
                  to={`/directory?category=${cat.id}`}
                  className="flex flex-col rounded-2xl overflow-hidden bg-slate-50 hover:bg-white hover:shadow-lg transition-all border border-slate-100 hover:border-slate-200 cursor-pointer group"
                  data-testid={`category-card-${cat.id}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
                    <img
                      src={imageSrc}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-full flex items-center justify-center bg-spruce-100 group-hover:bg-spruce-700 transition-colors" aria-hidden>
                      <Icon className="w-10 h-10 text-spruce-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
                      <span className="font-heading font-semibold text-sm text-white drop-shadow-sm">{cat.name}</span>
                      <span className="text-xs font-medium text-white/90 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full shrink-0">
                        <span className="text-2xl">{count>0 ? count : ''} </span> 
                        {count === 1 ? 'listing' : count === 0 ? '' : 'listings'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <span className="text-xs text-slate-500 line-clamp-2">{cat.description}</span>
                  </div>
                </Link>
                );
              })}
          </div>
        </div>
      </section>

      {/* Featured Vendors */}
      <section className="py-24 md:py-24 bg-slate-50" data-testid="featured-vendors-section">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="mb-12">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-center text-slate-900 mb-3">
                Featured Vendors
              </h2>
              <p className="text-base text-center md:text-lg text-slate-500">
                Trusted service providers ready to help with your relocation.
              </p>
            </div>

            <Link to="/directory" className="hidden mt-10 justify-center md:flex items-center gap-1 text-spruce-700 font-medium hover:underline" data-testid="view-all-vendors">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3].map(i => (
                <div key={i} className="animate-pulse rounded-xl bg-white h-80 border" />
              ))}
            </div>
          ) : featuredVendors.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No featured vendors yet. Admins can feature approved vendors from the dashboard.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredVendors.map(vendor => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          )}

          <div className="mt-10 text-center md:hidden">
            <Link to="/directory">
              <Button variant="outline" data-testid="view-all-vendors-mobile">View All Vendors</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Cities Section */}
      <section className="py-24 md:py-32 bg-white" data-testid="cities-section">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-center text-slate-900 mb-3">
              Explore Alberta Cities
            </h2>
            <p className="text-base text-center md:text-lg text-slate-500">
              Find services in your destination city.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {CITIES.map(city => (
              <Link
                key={city}
                to={`/directory?city=${city}`}
                className="flex items-center gap-2 px-5 py-3 rounded-full border border-slate-200 hover:border-spruce-300 hover:bg-spruce-700 transition-all text-sm font-medium text-slate-700 hover:text-white"
                data-testid={`city-link-${city.toLowerCase()}`}
              >
                <MapPin className="w-3.5 h-3.5" /> {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 bg-spruce-700 text-white" data-testid="cta-section">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            Are You a Local Business?
          </h2>
          <p className="text-lg text-spruce-100 mb-10 max-w-2xl mx-auto">
            Join Hey Alberta and connect with thousands of newcomers looking for trusted services. Start with a free listing today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button className="bg-white/10 text-white h-12 px-8 text-base rounded-xl" data-testid="cta-register-btn">
                List Your Business <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/about">
              <Button className="bg-secondary-600 border-white/30 text-white hover:bg-white/10 h-12 px-8 text-base rounded-xl" data-testid="cta-learn-more-btn">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}