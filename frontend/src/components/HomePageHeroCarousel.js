import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search } from 'lucide-react';
import { resolveMediaUrl } from '../lib/mediaUrl';

const DEFAULT_SLIDE = {
  imageUrl: '/background.jpeg',
  headline: 'Find trusted local Companies',
  headlineLine2: 'and community resources.',
  subhead:
    'Everything you need for a fresh start in Alberta — from movers and real estate to schools and utilities.',
};

function normalizeSlides(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [DEFAULT_SLIDE];
  const out = raw
    .map((s) => ({
      imageUrl: String(s?.imageUrl ?? '').trim(),
      headline: String(s?.headline ?? '').trim(),
      headlineLine2: String(s?.headlineLine2 ?? '').trim(),
      subhead: String(s?.subhead ?? '').trim(),
    }))
    .filter((s) => s.imageUrl);
  return out.length ? out : [DEFAULT_SLIDE];
}

/**
 * @param {{ slides?: Array<{ imageUrl?: string, headline?: string, headlineLine2?: string, subhead?: string }>, searchQuery: string, setSearchQuery: (v: string) => void, onSearch: (e: React.FormEvent) => void, isMobile: boolean }} props
 */
export default function HomePageHeroCarousel({
  slides: slidesProp,
  searchQuery,
  setSearchQuery,
  onSearch,
  isMobile,
}) {
  const slides = useMemo(() => normalizeSlides(slidesProp), [slidesProp]);
  const [index, setIndex] = useState(0);
  const n = slides.length;

  const safeIndex = n > 0 ? index % n : 0;

  useEffect(() => {
    setIndex((i) => (n > 0 ? i % n : 0));
  }, [n]);

  useEffect(() => {
    if (n <= 1) return undefined;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % n);
    }, 6500);
    return () => window.clearInterval(t);
  }, [n]);

  const go = useCallback(
    (i) => {
      if (i >= 0 && i < n) setIndex(i);
    },
    [n]
  );

  const slide = slides[safeIndex] || DEFAULT_SLIDE;
  const h1 = slide.headline || DEFAULT_SLIDE.headline;
  const h2 = slide.headlineLine2 || DEFAULT_SLIDE.headlineLine2;
  const sub = slide.subhead || DEFAULT_SLIDE.subhead;

  return (
    <section className="relative min-h-[520px] overflow-hidden md:min-h-[480px]" data-testid="hero-section">
      <div className="absolute inset-0">
        {slides.map((s, i) => {
          const src = s.imageUrl ? resolveMediaUrl(s.imageUrl) || s.imageUrl : '/background.jpeg';
          const active = i === safeIndex;
          return (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                active ? 'z-[1] opacity-100' : 'pointer-events-none z-0 opacity-0'
              }`}
              aria-hidden={!active}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
              <div
                className="absolute inset-0 bg-gradient-to-b from-black/78 via-black/68 to-black/58"
                aria-hidden
              />
              <div className="absolute inset-0 bg-black/25" aria-hidden />
            </div>
          );
        })}
      </div>

      <div className="relative z-10 container mx-auto flex max-w-7xl flex-col items-center px-4 pb-28 pt-16 text-center md:px-8 md:py-36">
        <div className="flex min-h-[200px] flex-col items-center justify-center md:min-h-[220px]">
          <h1 className="-mt-2 mb-6 flex flex-col items-center gap-2 text-center font-heading text-4xl font-bold tracking-tight text-white transition-all duration-500 sm:gap-3 sm:text-5xl md:mt-0 md:gap-4 lg:text-6xl">
            <span className="block">{h1}</span>
            {h2 ? <span className="block">{h2}</span> : null}
          </h1>
          <p className="mb-10 w-full max-w-2xl text-lg leading-relaxed text-white/95 transition-all duration-500 md:text-xl">
            {sub}
          </p>
        </div>

        <form onSubmit={onSearch} className="flex w-full max-w-xl justify-center gap-3" data-testid="hero-search-form">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-spruce-400" />
            <Input
              placeholder={isMobile ? 'Search ...' : 'Search services ...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 !text-lg placeholder:!text-lg placeholder:text-slate-500 rounded-xl border-0 bg-white/95 pl-4 shadow-lg backdrop-blur md:pl-12"
              data-testid="hero-search-input"
            />
          </div>
          <Button
            type="submit"
            className="flex h-14 shrink-0 items-center justify-center rounded-xl bg-spruce-700 px-4 text-white shadow-lg shadow-spruce-950/25 hover:bg-spruce-800 md:px-8"
            data-testid="hero-search-btn"
          >
            <Search className="h-5 w-5 shrink-0 md:mr-2" aria-hidden />
            <span className="hidden text-sm md:inline">SEARCH LISTING</span>
          </Button>
        </form>

        {n > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2" role="tablist" aria-label="Hero slides">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === safeIndex}
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
                  i === safeIndex ? 'w-10 bg-white shadow-sm' : 'w-6 bg-white/35 hover:bg-white/55'
                }`}
                data-testid={`hero-carousel-dot-${i}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
