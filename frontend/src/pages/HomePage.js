import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TestimonialsFlowSection from '../components/TestimonialsFlowSection';
import CategoryBrowseCarousel from '../components/CategoryBrowseCarousel';
import ExploreAlbertaCitiesSection from '../components/ExploreAlbertaCitiesSection';
import FeaturedListingsSection from '../components/FeaturedListingsSection';
import HomeCtaSection from '../components/HomeCtaSection';
import MembershipTiersSection from '../components/MembershipTiersSection';
import UpgradeToVendorModal from '../components/UpgradeToVendorModal';
import { useAddListingClick } from '../hooks/useAddListingClick';
import { useSEO } from '../hooks/useSEO';
import { listingAPI, siteAPI } from '../lib/api';
import HomePageHeroCarousel from '../components/HomePageHeroCarousel';
import { CATEGORIES } from '../data/categories';
import { directorySearchQuery } from '../constants';

export default function HomePage() {
  const navigate = useNavigate();
  const { handleAddListingClick, upgradeModalProps } = useAddListingClick();
  const [searchQuery, setSearchQuery] = useState('');
  const [listingCounts, setListingCounts] = useState({});
  const [cityCounts, setCityCounts] = useState({});
  const [categoryImageOverrides, setCategoryImageOverrides] = useState({});
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [siteSettings, setSiteSettings] = useState(null);

  useSEO({
    title: 'Discover Local Businesses',
    description: 'Browse thousands of trusted local businesses across Alberta. Find services you need in your community from real businesses.',
  });

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

  const sortedCategories = [...CATEGORIES].sort((a, b) => {
    const countA = listingCounts[a.id] ?? 0;
    const countB = listingCounts[b.id] ?? 0;
    return countB - countA;
  });
  return (
    <div data-testid="homepage">
      <HomePageHeroCarousel
        slides={siteSettings?.homeHeroSlides}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        isMobile={isMobile}
      />

      {/* Categories — horizontal carousel */}
      <section className="pt-16 md:pt-24 pb-12 md:pb-20 bg-slate-50" data-testid="categories-section">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="text-center mb-10 md:mb-12 max-w-4xl mx-auto">
           
            <h2 className="font-heading text-3xl sm:text-4xl md:text-[2.5rem] font-bold text-slate-900 leading-tight">
              Browse Top Categories.
            </h2>
          </div>

          <CategoryBrowseCarousel
            categories={sortedCategories}
            listingCounts={listingCounts}
            categoryImageOverrides={categoryImageOverrides}
          />
        </div>
      </section>

      <FeaturedListingsSection />

      <ExploreAlbertaCitiesSection cityCounts={cityCounts} />

      <TestimonialsFlowSection />

      <HomeCtaSection onListBusiness={handleAddListingClick} />
      <MembershipTiersSection />

      <UpgradeToVendorModal {...upgradeModalProps} />
    </div>
  );
}