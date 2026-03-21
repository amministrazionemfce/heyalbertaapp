import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import FeaturedVendorsLogoGrid from '../components/FeaturedVendorsLogoGrid';
import TestimonialsFlowSection from '../components/TestimonialsFlowSection';
import CategoryBrowseCard from '../components/CategoryBrowseCard';
import CategoryBrowseToolbar from '../components/CategoryBrowseToolbar';
import ExploreAlbertaCitiesSection from '../components/ExploreAlbertaCitiesSection';
import FeaturedListingsSection from '../components/FeaturedListingsSection';
import HomeCtaSection from '../components/HomeCtaSection';
import HomeMembershipTiersSection from '../components/HomeMembershipTiersSection';
import UpgradeToVendorModal from '../components/UpgradeToVendorModal';
import { useAddListingClick } from '../hooks/useAddListingClick';
import { listingAPI } from '../lib/api';
import { CATEGORIES } from '../data/categories';
import { Search } from 'lucide-react';
import { directorySearchQuery } from '../constants';

const INITIAL_CATEGORIES = 8;

export default function HomePage() {
  const navigate = useNavigate();
  const { handleAddListingClick, upgradeModalProps } = useAddListingClick();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [listingCounts, setListingCounts] = useState({});
  const [cityCounts, setCityCounts] = useState({});
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
      listingAPI.countsByCategory().then((res) => setListingCounts(res.data || {})),
      listingAPI.countsByCity().then((res) => setCityCounts(res.data || {})),
    ]);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(directorySearchQuery(searchQuery));
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

        <div className="relative container mx-auto px-4 md:px-8 max-w-7xl pt-16 pb-24 md:py-36 flex flex-col items-center text-center">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 -mt-2 md:mt-0 flex flex-col items-center text-center gap-2 sm:gap-3 md:gap-4">
              <span className="block">Find trusted local Companies</span>
              <span className="block">and community resources.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-200 leading-relaxed mb-10 w-full max-w-2xl">
            Everything you need for a fresh start in Alberta — from movers and real estate to schools and utilities.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-3 w-full max-w-xl justify-center" data-testid="hero-search-form">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                
                <Input
                  placeholder={isMobile ? 'Search ...' : 'Search services ...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 md:pl-12 h-14 !text-lg placeholder:!text-lg placeholder:text-slate-500 bg-white/95 backdrop-blur border-0 shadow-lg rounded-xl"
                  data-testid="hero-search-input"
                />
              </div>
              <Button
                type="submit"
                className="h-14 px-4 md:px-8 rounded-xl shadow-lg flex items-center justify-center bg-purple-700 hover:bg-purple-800 text-white"
                data-testid="hero-search-btn"
              >
                <Search className="w-5 h-5 md:mr-2 shrink-0" aria-hidden />
                <span className="hidden md:inline text-sm">SEARCH LISTING</span>
              </Button>
            </form>
        </div>
      </section>

      {/* Categories — eyebrow + grid (6 per row on xl) */}
      <section className="pt-16 md:pt-24 pb-12 md:pb-20 bg-slate-50" data-testid="categories-section">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="text-center mb-10 md:mb-12 max-w-4xl mx-auto">
           
            <h2 className="font-heading text-3xl sm:text-4xl md:text-[2.5rem] font-bold text-slate-900 leading-tight">
              Browse Top Categories.
            </h2>
          </div>

          <CategoryBrowseToolbar
            categorySearch={categorySearch}
            onCategorySearchChange={setCategorySearch}
            categoryOrder={categoryOrder}
            onCategoryOrderChange={setCategoryOrder}
            showExpandToggle={sortedCategories.length > INITIAL_CATEGORIES}
            categoriesExpanded={categoriesExpanded}
            onToggleCategoriesExpanded={() => setCategoriesExpanded((v) => !v)}
            totalCategoriesShown={sortedCategories.length}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-5">
            {categoriesToShow.map((cat) => {
              const idx = CATEGORIES.findIndex((c) => c.id === cat.id);
              const imageNum = idx >= 0 ? idx + 1 : 1;
              const imageSrc = `/services/${imageNum}.jpg`;
              return (
                <CategoryBrowseCard
                  key={cat.id}
                  category={cat}
                  listingCount={listingCounts[cat.id] ?? 0}
                  imageSrc={imageSrc} 
                />
              );
            })}
          </div>
        </div>
      </section>

      <FeaturedListingsSection />

      <FeaturedVendorsLogoGrid />

      <ExploreAlbertaCitiesSection cityCounts={cityCounts} />

      <TestimonialsFlowSection />

      <HomeMembershipTiersSection onGetStarted={handleAddListingClick} />

      <HomeCtaSection onListBusiness={handleAddListingClick} />
      <UpgradeToVendorModal {...upgradeModalProps} />
    </div>
  );
}