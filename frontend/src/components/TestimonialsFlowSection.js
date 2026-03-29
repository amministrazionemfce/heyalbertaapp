import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';
import { Star } from 'lucide-react';
import { siteAPI } from '../lib/api';
import {
  DEFAULT_HOME_TESTIMONIALS,
  DEFAULT_TESTIMONIALS_HEADING,
  formatTestimonialTimeLabel,
  homeTestimonialsHeadingFromSettings,
  mergeHomeTestimonialsFromSettings,
} from '../data/homeTestimonials';

export function TestimonialCard({ item, disableReadMoreLink = false }) {
  const initials = (item.name || 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const rating = Math.min(5, Math.max(0, Number(item.rating) || 0));

  return (
    <article
      className="w-[min(100%,320px)] shrink-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60 md:w-[340px] md:p-6"
      data-testid={`testimonial-card-${item.id}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-spruce-800 to-spruce-700 text-sm font-bold text-white"
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="font-semibold text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-400">{formatTestimonialTimeLabel(item.time)}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
            aria-hidden
          />
        ))}
      </div>
      <p className="mt-3 text-left text-sm leading-relaxed text-slate-600 line-clamp-4">{item.text}</p>
      {disableReadMoreLink ? (
        <span className="mt-2 inline-block text-sm font-semibold text-slate-400">Read more</span>
      ) : (
        <Link
          to={ROUTES.ABOUT}
          className="mt-2 inline-block text-sm font-semibold text-spruce-700 hover:text-spruce-800 hover:underline"
        >
          Read more
        </Link>
      )}
    </article>
  );
}

/**
 * Same layout as the home page block.
 */
export function TestimonialsFlowInner({ items, heading, disableReadMoreLink = false }) {
  const list = items?.length ? items : DEFAULT_HOME_TESTIMONIALS.map((t) => ({ ...t }));
  const [active, setActive] = useState(0);
  const loop = [...list, ...list];

  useEffect(() => {
    const t = setInterval(() => {
      setActive((i) => (i + 1) % list.length);
    }, 5000);
    return () => clearInterval(t);
  }, [list.length]);

  const title = heading?.trim() || DEFAULT_TESTIMONIALS_HEADING;

  return (
    <section
      className="border-t border-slate-200/80 bg-gradient-to-b from-slate-50 to-white py-16 md:py-24"
      data-testid="testimonials-flow-section"
    >
      <div className="container mx-auto max-w-7xl px-4 md:px-8">
        <h2 className="mb-10 text-center font-heading text-3xl font-bold text-slate-900 md:mb-12 md:text-4xl">
          {title}
        </h2>

        <div className="group relative overflow-hidden py-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-slate-50 to-transparent md:w-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent md:w-20" />
          <div className="flex w-max animate-marquee gap-6 md:gap-8 group-hover:[animation-play-state:paused]">
            {loop.map((item, idx) => (
              <TestimonialCard
                key={`${item.id}-${idx}`}
                item={item}
                disableReadMoreLink={disableReadMoreLink}
              />
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-2" role="tablist" aria-label="Testimonial highlights">
          {list.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? 'w-8 bg-spruce-800' : 'w-4 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsFlowPreview({ items, heading, showPreviewBanner = true }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-slate-200 shadow-inner"
      data-testid="testimonials-flow-preview"
    >
      <TestimonialsFlowInner items={items} heading={heading} disableReadMoreLink />
    </div>
  );
}

export default function TestimonialsFlowSection() {
  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => {
    let cancelled = false;
    siteAPI
      .settings()
      .then((r) => {
        if (!cancelled) setSiteSettings(r.data || null);
      })
      .catch(() => {
        if (!cancelled) setSiteSettings(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => mergeHomeTestimonialsFromSettings(siteSettings), [siteSettings]);
  const heading = useMemo(() => homeTestimonialsHeadingFromSettings(siteSettings), [siteSettings]);

  return <TestimonialsFlowInner items={items} heading={heading} />;
}
