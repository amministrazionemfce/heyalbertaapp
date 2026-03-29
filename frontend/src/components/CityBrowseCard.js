import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { directoryCityQuery } from '../constants';

/**
 * City tile — same visual language as category cards: image + bottom gradient + centered text.
 */
export default function CityBrowseCard({ cityName, listingCount = 0, imageSrc }) {
  const count = listingCount ?? 0;
  const slug = cityName.toLowerCase().replace(/\s+/g, '-');

  return (
    <Link
      to={directoryCityQuery(cityName)}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl bg-slate-200 shadow-md ring-1 ring-black/5 transition-all duration-300 hover:shadow-xl hover:ring-black/10"
      data-testid={`city-card-${slug}`}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden sm:aspect-[4/5]">
        <img
          src={imageSrc}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
            e.target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div
          className="hidden absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200"
          aria-hidden
        >
          <MapPin className="h-10 w-10 text-spruce-600/80" />
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-[linear-gradient(to_top,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.55)_42%,rgba(0,0,0,0.15)_72%,transparent_100%)]"
          aria-hidden
        />

        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center justify-end px-4 pb-6 pt-16 text-center sm:pb-7 sm:pt-20">
          <h3 className="font-heading text-lg font-bold leading-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.65)] sm:text-xl">
            {cityName}
          </h3>
          <p className="mt-2 text-sm font-normal text-white/95 [text-shadow:0_1px_8px_rgba(0,0,0,0.55)]">
            {count} Listing
          </p>
        </div>
      </div>
    </Link>
  );
}
