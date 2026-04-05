import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategoryIcon } from '../data/categories';
import { directoryCategoryQuery } from '../constants';

/**
 * Homepage category tile — full-bleed image, bottom gradient only (reference style),
 * centered category name + listing count (no separate text panel).
 */
export default function CategoryBrowseCard({ category, listingCount = 0, imageSrc }) {
  const Icon = getCategoryIcon(category.icon);
  const count = listingCount ?? 0;
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [imageSrc]);

  return (
    <Link
      to={directoryCategoryQuery(category.id)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-slate-200 shadow-md transition-all duration-300 hover:shadow-lg"
      data-testid={`category-card-${category.id}`}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden sm:aspect-[4/5]">
        {!imgFailed ? (
          <img
            src={imageSrc}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : null}
        <div
          className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 ${
            imgFailed ? '' : 'hidden'
          }`}
          aria-hidden
        >
          <Icon className="h-12 w-12 text-spruce-600/80" />
        </div>

        {/* Bottom half: dark gradient for legible white text (matches reference) */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-[linear-gradient(to_top,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.55)_42%,rgba(0,0,0,0.15)_72%,transparent_100%)]"
          aria-hidden
        />

        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center justify-end px-4 pb-6 pt-16 text-center sm:pb-7 sm:pt-20">
          <h3 className="font-heading text-lg font-bold leading-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.65)] sm:text-xl">
            {category.name}
          </h3>
          <p className="mt-2 text-sm font-normal text-white text-bold">
            {count} Listing
          </p>
        </div>
      </div>
    </Link>
  );
}
