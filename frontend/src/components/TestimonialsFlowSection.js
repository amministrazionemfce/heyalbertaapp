import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';
import { Star } from 'lucide-react';

/** Static testimonials — replace with API when available */
const TESTIMONIALS = [
  {
    id: '1',
    name: 'Priya K.',
    time: '2 days ago',
    text:
      'Hey Alberta made finding a realtor and movers so simple. Everything was clear and the vendors actually responded!',
    rating: 5,
  },
  {
    id: '2',
    name: 'Marcus T.',
    time: '1 week ago',
    text:
      'We relocated from Ontario and used the guides plus the directory. Saved us hours of googling random companies.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Elena R.',
    time: '2 weeks ago',
    text:
      'Loved the verified vendor badges. Felt safer choosing childcare and healthcare providers for our family.',
    rating: 5,
  },
  {
    id: '4',
    name: 'James W.',
    time: '3 weeks ago',
    text:
      'Clean layout, easy filters by city. Found a great home services company in Calgary within a day.',
    rating: 5,
  },
];

function TestimonialCard({ item }) {
  const initials = item.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <article
      className="w-[min(100%,320px)] shrink-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60 md:w-[340px] md:p-6"
      data-testid={`testimonial-card-${item.id}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-sm font-bold text-white"
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="font-semibold text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-400">{item.time}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
            aria-hidden
          />
        ))}
      </div>
      <p className="mt-3 text-left text-sm leading-relaxed text-slate-600 line-clamp-4">{item.text}</p>
      <Link
        to={ROUTES.ABOUT}
        className="mt-2 inline-block text-sm font-semibold text-violet-600 hover:text-violet-700 hover:underline"
      >
        Read more
      </Link>
    </article>
  );
}

/**
 * Auto-flowing horizontal marquee of testimonial cards + dot indicators synced to auto-rotate index.
 */
export default function TestimonialsFlowSection() {
  const [active, setActive] = useState(0);
  const loop = [...TESTIMONIALS, ...TESTIMONIALS];

  useEffect(() => {
    const t = setInterval(() => {
      setActive((i) => (i + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      className="border-t border-slate-200/80 bg-gradient-to-b from-slate-50 to-white py-16 md:py-24"
      data-testid="testimonials-flow-section"
    >
      <div className="container mx-auto max-w-7xl px-4 md:px-8">
        <h2 className="mb-10 text-center font-heading text-3xl font-bold text-slate-900 md:mb-12 md:text-4xl">
          What People Say About Us
        </h2>

        {/* Infinite marquee — duplicated list for seamless loop */}
        <div className="group relative overflow-hidden py-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-slate-50 to-transparent md:w-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent md:w-20" />
          <div className="flex w-max animate-marquee gap-6 md:gap-8 group-hover:[animation-play-state:paused]">
            {loop.map((item, idx) => (
              <TestimonialCard key={`${item.id}-${idx}`} item={item} />
            ))}
          </div>
        </div>

        {/* Dots — reflect auto-advance for visual feedback */}
        <div className="mt-8 flex justify-center gap-2" role="tablist" aria-label="Testimonial highlights">
          {TESTIMONIALS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? 'w-8 bg-violet-600' : 'w-4 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
