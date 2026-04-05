import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CategoryBrowseCard from './CategoryBrowseCard';
import { CATEGORIES } from '../data/categories';
import { resolveMediaUrl } from '../lib/mediaUrl';

/**
 * Horizontal scroll strip with prev/next controls — same interaction as Explore Alberta Cities.
 * Card widths mirror the former grid (2 / 3 / 4 / 6 per row at breakpoints) so tiles stay the same size.
 */
export default function CategoryBrowseCarousel({ categories, listingCounts = {}, categoryImageOverrides = {} }) {
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

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
  }, [categories, updateScrollState]);

  const scrollPage = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const delta = direction * el.clientWidth * 0.92;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const itemClass =
    'w-[calc((100%-1rem)/2)] shrink-0 snap-start ' +
    'sm:w-[calc((100%-2rem)/3)] ' +
    'lg:w-[calc((100%-3.75rem)/4)] ' +
    'xl:w-[calc((100%-6.25rem)/6)]';

  return (
    <div className="relative" data-testid="category-browse-carousel">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-10 bg-gradient-to-r from-slate-50 to-transparent md:w-14"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-10 bg-gradient-to-l from-slate-50 to-transparent md:w-14"
        aria-hidden
      />

      <button
        type="button"
        onClick={() => scrollPage(-1)}
        disabled={!canLeft}
        className="absolute left-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-800 shadow-lg transition-all hover:bg-slate-50 hover:shadow-xl disabled:pointer-events-none disabled:opacity-30 md:h-12 md:w-12 md:-translate-x-1 lg:-translate-x-2"
        aria-label="Previous categories"
        data-testid="categories-carousel-prev"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={() => scrollPage(1)}
        disabled={!canRight}
        className="absolute right-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-800 shadow-lg transition-all hover:bg-slate-50 hover:shadow-xl disabled:pointer-events-none disabled:opacity-30 md:h-12 md:w-12 md:translate-x-1 lg:translate-x-2"
        aria-label="Next categories"
        data-testid="categories-carousel-next"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 pl-1 pr-1 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-5 md:px-12 [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((cat) => {
          const idx = CATEGORIES.findIndex((c) => c.id === cat.id);
          const imageNum = idx >= 0 ? idx + 1 : 1;
          const defaultImageSrc = `/services/${imageNum}.jpg`;
          const override = categoryImageOverrides?.[cat.id];
          const imageSrc = override?.trim()
            ? resolveMediaUrl(override) || override
            : defaultImageSrc;
          return (
            <div key={cat.id} className={itemClass}>
              <CategoryBrowseCard
                category={cat}
                listingCount={listingCounts[cat.id] ?? 0}
                imageSrc={imageSrc}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
