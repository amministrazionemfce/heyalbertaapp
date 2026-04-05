import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CityBrowseCard from './CityBrowseCard';
import { CITIES } from '../data/categories';
import { getCityImageUrl } from '../data/cityImages';
import { listingAPI } from '../lib/api';

export default function ExploreAlbertaCitiesSection({ cityCounts = {} }) {
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [cityImageOverrides, setCityImageOverrides] = useState({});

  useEffect(() => {
    let cancelled = false;
    listingAPI
      .cityImages()
      .then((res) => {
        if (cancelled) return;
        const raw = res.data || {};
        const normalized = {};
        for (const [k, v] of Object.entries(raw)) {
          if (!k) continue;
          normalized[String(k).toLowerCase()] = String(v ?? '').trim();
        }
        setCityImageOverrides(normalized);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = scrollWidth - clientWidth;
    setCanLeft(scrollLeft > 6);
    setCanRight(scrollLeft < max - 6);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  useEffect(() => {
    updateScrollState();
  }, [cityCounts, updateScrollState]);

  const scrollPage = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const delta = direction * el.clientWidth * 0.92;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const countForCity = (city) => {
    const key = city.trim().toLowerCase();
    return cityCounts[key] ?? 0;
  };

  return (
    <section
      className="border-t border-slate-200/80 bg-slate-50 from-white via-slate-50/80 to-slate-100/60 py-20 md:py-28"
      data-testid="cities-section"
    >
      <div className="container mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-10 text-center md:mb-12">
          <h2 className="font-heading text-3xl font-bold text-slate-900 sm:text-4xl md:text-[2.35rem]">
            Explore Alberta Cities
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 md:text-lg">
            Find trusted listings and services in the community you’re moving to.
          </p>
        </div>

        <div className="relative">
          {/* Edge fades */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-10 bg-gradient-to-r from-white to-transparent md:w-14"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-10 bg-gradient-to-l from-white to-transparent md:w-14"
            aria-hidden
          />

          <button
            type="button"
            onClick={() => scrollPage(-1)}
            disabled={!canLeft}
            className="absolute left-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-800 shadow-lg transition-all hover:bg-slate-50 hover:shadow-xl disabled:pointer-events-none disabled:opacity-30 md:h-12 md:w-12 md:-translate-x-1 lg:-translate-x-2"
            aria-label="Previous cities"
            data-testid="cities-carousel-prev"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => scrollPage(1)}
            disabled={!canRight}
            className="absolute right-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-800 shadow-lg transition-all hover:bg-slate-50 hover:shadow-xl disabled:pointer-events-none disabled:opacity-30 md:h-12 md:w-12 md:translate-x-1 lg:translate-x-2"
            aria-label="Next cities"
            data-testid="cities-carousel-next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 pl-1 pr-1 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-4 md:px-12 [&::-webkit-scrollbar]:hidden"
          >
            {CITIES.map((city) => (
              <div
                key={city}
                className="w-[calc((100%-1rem)/2)] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/3)] md:w-[calc((100%-2rem)/4)] lg:w-[calc((100%-2.5rem)/5)] xl:w-[calc((100%-3rem)/6)] 2xl:w-[calc((100%-3.5rem)/7)]"
              >
                <CityBrowseCard
                  cityName={city}
                  listingCount={countForCity(city)}
                  imageSrc={getCityImageUrl(city, cityImageOverrides)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
