import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Horizontally scrollable category pills with left/right arrow controls.
 * Reusable for Featured Listings, filters, etc.
 */
export default function CategoryScrollTabs({
  items,
  value,
  onChange,
  accentClass = 'bg-purple-700 text-white shadow-md',
  inactiveClass = 'bg-white text-slate-700 border border-slate-200',
  'aria-label': ariaLabel = 'Category filters',
  'data-testid': dataTestId = 'category-scroll-tabs',
}) {
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = scrollWidth - clientWidth;
    setCanLeft(scrollLeft > 4);
    setCanRight(scrollLeft < max - 4);
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
  }, [updateScrollState, items.length]);

  const scrollByDir = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(180, el.clientWidth * 0.45), behavior: 'smooth' });
  };

  return (
    <div className="relative" data-testid={dataTestId}>
      <button
        type="button"
        onClick={() => scrollByDir(-1)}
        disabled={!canLeft}
        className="absolute left-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-purple-200 bg-white shadow-md transition disabled:pointer-events-none disabled:opacity-25 md:h-10 md:w-10"
        aria-label="Scroll categories left"
        data-testid="category-tabs-prev"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollByDir(1)}
        disabled={!canRight}
        className="absolute right-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-purple-200 bg-white shadow-md transition disabled:pointer-events-none disabled:opacity-25 md:h-10 md:w-10"
        aria-label="Scroll categories right"
        data-testid="category-tabs-next"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div
        ref={scrollRef}
        role="tablist"
        aria-label={ariaLabel}
        className="mx-10 flex gap-2 overflow-x-auto scroll-smooth pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] md:mx-12 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const selected = value === item.id;
          return (
            <button
              key={item.id === '' ? 'all' : item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(item.id)}
              className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-all md:px-5 md:py-2.5 md:text-[0.95rem] ${
                selected ? accentClass : inactiveClass
              }`}
              data-testid={`category-tab-${item.id === '' ? 'all' : item.id}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
