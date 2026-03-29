import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FeaturedVendorsLogoGrid from '../components/FeaturedVendorsLogoGrid';
import TestimonialsFlowSection from '../components/TestimonialsFlowSection';
import CategoryBrowseCard from '../components/CategoryBrowseCard';
import CategoryBrowseToolbar from '../components/CategoryBrowseToolbar';
import ExploreAlbertaCitiesSection from '../components/ExploreAlbertaCitiesSection';
import FeaturedListingsSection from '../components/FeaturedListingsSection';
import HomeCtaSection from '../components/HomeCtaSection';
import MembershipTiersSection from '../components/MembershipTiersSection';
import UpgradeToVendorModal from '../components/UpgradeToVendorModal';
import { useAddListingClick } from '../hooks/useAddListingClick';
import { listingAPI, siteAPI } from '../lib/api';
import HomePageHeroCarousel from '../components/HomePageHeroCarousel';
import { CATEGORIES } from '../data/categories';
import { directorySearchQuery } from '../constants';

const INITIAL_CATEGORIES = 8;

export default function HomePage() {
  const navigate = useNavigate();
  const { handleAddListingClick, upgradeModalProps } = useAddListingClick();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [listingCounts, setListingCounts] = useState({});
  const [cityCounts, setCityCounts] = useState({});
  const [categoryImageOverrides, setCategoryImageOverrides] = useState({});
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryOrder, setCategoryOrder] = useState('listing'); // 'listing' | 'review' | 'popular'
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [siteSettings, setSiteSettings] = useState(null);

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
      listingAPI.categoryImages().then((res) => setCategoryImageOverrides(res.data || {})),
      siteAPI.settings().then((res) => setSiteSettings(res.data)),
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
      <HomePageHeroCarousel
        slides={siteSettings?.homeHeroSlides}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        isMobile={isMobile}
      />

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
              const defaultImageSrc = `/services/${imageNum}.jpg`;
              const imageSrc = categoryImageOverrides?.[cat.id] || defaultImageSrc;
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

      <HomeCtaSection onListBusiness={handleAddListingClick} />
      <MembershipTiersSection />

      <UpgradeToVendorModal {...upgradeModalProps} />
    </div>
  );
}