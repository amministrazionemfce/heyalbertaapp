import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';
import { resolveMediaUrl } from '../lib/mediaUrl';

function CtaLink({ href, className, children }) {
  if (!href || href === '#') return null;
  const external = /^https?:\/\//i.test(href);
  if (external) {
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

export default function NewsPageHero({ settings }) {
  const raw = settings?.newsHeroImage?.trim();
  const bg =
    raw && (resolveMediaUrl(raw) || raw)
      ? resolveMediaUrl(raw) || raw
      : '/background.jpeg';
  const headline = settings?.newsHeadline || 'Life, Business, and Community in Alberta.';
  const sub = settings?.newsSubhead || '';
  const cta1 = settings?.newsCtaPrimaryText || 'Subscribe for weekly updates';
  const cta1Href = settings?.newsCtaPrimaryLink || '/register';
  const cta2 = settings?.newsCtaSecondaryText || 'List your business';
  const cta2Href = settings?.newsCtaSecondaryLink || '/register';

  return (
    <section className="relative min-h-[420px] md:min-h-[480px] flex flex-col justify-center" data-testid="news-page-hero">
      <div className="absolute inset-0">
        <img src={bg} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/65 to-slate-950/85" />
      </div>

      <div className="relative z-10 container mx-auto max-w-5xl px-4 md:px-8 py-16 md:py-24 text-center">

        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight max-w-4xl mx-auto">
          {headline}
        </h1>
        {sub ? (
          <p className="mt-5 text-base md:text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">{sub}</p>
        ) : null}

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <CtaLink
            href={cta1Href}
            className="inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-md bg-white px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-900 shadow-lg hover:bg-slate-100 transition-colors"
          >
            {cta1}
          </CtaLink>
          <CtaLink
            href={cta2Href}
            className="inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-md bg-spruce-800 px-6 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-lg hover:bg-spruce-700 transition-colors"
          >
            {cta2}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
