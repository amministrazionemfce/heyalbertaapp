import { useRef, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { CATEGORIES } from '../data/categories';
import { directoryCategoryQuery } from '../constants';

function CardLink({ href, className, children }) {
  if (!href || href === '#') {
    return <div className={className}>{children}</div>;
  }
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}

export default function NewsCategoriesSection({ managedItems, listingCounts, categoryImageOverrides }) {
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateScroll = useCallback(() => {
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
    updateScroll();
    el.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll);
    return () => {
      el.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, [updateScroll, managedItems]);

  const scrollBy = (delta) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const useManaged = Array.isArray(managedItems) && managedItems.length > 0;

  const items = useManaged
    ? managedItems.map((r) => {
        const img = r.imageUrl ? resolveMediaUrl(r.imageUrl) || r.imageUrl : '/services/1.jpg';
        return {
          key: r.id,
          title: r.title,
          subtitle: (r.excerpt || r.content || '').replace(/\s+/g, ' ').trim().slice(0, 140),
          image: img,
          href: (r.linkUrl || '').trim() || '#',
        };
      })
    : CATEGORIES.map((cat) => {
        const idx = CATEGORIES.findIndex((c) => c.id === cat.id);
        const imageNum = idx >= 0 ? idx + 1 : 1;
        const defaultImageSrc = `/services/${imageNum}.jpg`;
        const imageSrc = categoryImageOverrides?.[cat.id] || defaultImageSrc;
        const count = listingCounts?.[cat.id] ?? 0;
        return {
          key: cat.id,
          title: cat.name,
          subtitle: cat.description || `${count} listing${count === 1 ? '' : 's'} in Alberta`,
          image: imageSrc,
          href: directoryCategoryQuery(cat.id), 
        };
      });

  return (
    <section className="bg-white py-14 md:py-20" data-testid="news-categories-section">
      <div className="container mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-spruce-800 mb-2">Explore our categories</p>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
            Browse services that make life in Alberta easier
          </h2>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => scrollBy(-340)}
            disabled={!canLeft}
            className="absolute left-0 top-1/2 z-20 -translate-y-1/2 -translate-x-1 md:-translate-x-3 hidden sm:flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(340)}
            disabled={!canRight}
            className="absolute right-0 top-1/2 z-20 -translate-y-1/2 translate-x-1 md:translate-x-3 hidden sm:flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-5 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item) => (
              <CardLink
                key={item.key}
                href={item.href}
                className="group flex-shrink-0 w-[min(100%,280px)] sm:w-[260px] md:w-[280px] snap-start overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md transition-shadow duration-300 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={item.image}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 [transform:translateZ(0)] will-change-transform group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 text-left">
                  <h3 className="font-heading font-bold text-slate-900 line-clamp-2 leading-snug">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">{item.subtitle}</p>
                </div>
              </CardLink>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
