import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TRUSTED_PARTNER_LOGOS } from '../data/trustedPartnerLogos';
import { ROUTES } from '../constants';
import { getPartnerLogoCandidates } from '../lib/vendorLogo';

/**
 * Partner logo strip — real brand marks via Clearbit / favicon CDNs (see trustedPartnerLogos.js).
 * Layout: 5 + 5 rows; links open brand sites in a new tab.
 */
function PartnerLogoBox({ partner }) {
  const name = partner.name;
  const href = partner.href || `https://${partner.domain}`;
  const candidates = useMemo(() => getPartnerLogoCandidates(partner.domain), [partner.domain]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [partner.id]);

  const activeSrc = candidateIndex < candidates.length ? candidates[candidateIndex] : null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-[112px] w-full max-w-[220px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-6 shadow-sm transition hover:border-violet-300 hover:shadow-md md:min-h-[128px]"
      data-testid={`trusted-partner-logo-${partner.id}`}
    >
      {activeSrc ? (
        <>
          <img
            src={activeSrc}
            alt=""
            className="max-h-10 w-auto max-w-full object-contain md:max-h-12"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setCandidateIndex((i) => i + 1)}
          />
          <span className="mt-2 line-clamp-1 text-center text-[0.65rem] font-medium text-slate-500 md:text-xs">
            {name}
          </span>
        </>
      ) : (
        <span className="text-center text-sm font-semibold leading-tight text-slate-700 line-clamp-3 md:text-base">
          {name}
        </span>
      )}
    </a>
  );
}

export default function FeaturedVendorsLogoGrid({ partners = TRUSTED_PARTNER_LOGOS }) {
  const display = partners.slice(0, 10);
  const row1 = display.slice(0, 5);
  const row2 = display.slice(5, 10);
  const countLabel = `${Math.max(display.length, 10)}+`;

  return (
    <section
      className="border-t border-slate-200/80 bg-slate-50 py-16 md:py-24"
      data-testid="featured-vendors-section"
    >
      <div className="container mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto mb-10 max-w-4xl text-center md:mb-14">
          <h2 className="font-heading text-2xl font-bold leading-snug text-slate-900 sm:text-3xl md:text-4xl md:leading-tight">
            We Have Worked With{' '}
            <span className="relative inline-block">
              <span className="text-violet-600">{countLabel}</span>
              <svg
                className="absolute -bottom-1 left-0 w-full text-violet-500"
                viewBox="0 0 200 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M4 8C40 2 80 2 100 6C120 10 160 10 196 4"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="opacity-90"
                />
              </svg>
            </span>{' '}
            Trusted Companies
          </h2>
          <p className="mt-4 text-base text-slate-600 md:text-lg">
            Brands and tools we integrate with to deliver a great experience for newcomers in Alberta.
          </p>
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 md:grid-cols-5 md:gap-6">
            {row1.map((p) => (
              <PartnerLogoBox key={p.id} partner={p} />
            ))}
          </div>
          {row2.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {row2.map((p) => (
                <PartnerLogoBox key={p.id} partner={p} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            to={ROUTES.DIRECTORY}
            className="inline-flex min-w-[200px] items-center justify-center rounded-full border-2 border-purple-800 bg-white px-10 py-3 text-sm font-semibold text-purple-900 shadow-sm transition hover:bg-purple-900 hover:text-white"
            data-testid="featured-vendors-view-more"
          >
            View more
          </Link>
        </div>
      </div>
    </section>
  );
}
