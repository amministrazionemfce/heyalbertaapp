import { Skeleton } from './ui/skeleton';

function DirectoryListingCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2x bg-white">
      <Skeleton className="h-44 w-full rounded-none rounded-t-2xl" />
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <Skeleton className="h-6 w-24 rounded-md" />
        <Skeleton className="ml-auto h-9 w-9 shrink-0 rounded-full" />
      </div>
      <div className="flex flex-1 flex-col p-4 pt-3.5">
        <Skeleton className="h-5 w-[92%] rounded" />
        <Skeleton className="mt-2 h-5 w-[70%] rounded" />
        <Skeleton className="mt-3 h-3.5 w-full rounded" />
        <Skeleton className="mt-2 h-3.5 w-[85%] rounded" />
        <Skeleton className="mt-4 h-3 w-32 rounded" />
      </div>
    </div>
  );
}

/**
 * Matches DirectoryPage listings grid breakpoints.
 */
export function DirectoryListingsGridSkeleton({ count = 10 }) {
  const n = Math.max(1, Math.min(Number(count) || 10, 24));
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 md:gap-6 lg:gap-7"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading listings"
      data-testid="directory-listings-loading"
    >
      {Array.from({ length: n }, (_, i) => (
        <DirectoryListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListingDetailPageSkeleton() {
  return (
    <div
      className="min-h-screen"
      data-testid="listing-detail-page"
      role="status"
      aria-busy="true"
      aria-label="Loading listing details"
    >
      <div className="container mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <div className="mb-4 flex flex-wrap items-center gap-2" aria-hidden>
          <Skeleton className="h-4 w-10 rounded" />
          <Skeleton className="h-4 w-3 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 w-3 rounded" />
          <Skeleton className="h-4 w-36 rounded" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          <div className="space-y-8 lg:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-8 w-64 max-w-full rounded-lg" />
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Skeleton className="h-16 w-24 rounded-lg" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-36 rounded-full" />
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm md:flex-row md:gap-4 md:p-3">
              <div className="order-2 flex flex-row gap-2 md:order-1 md:w-16 md:flex-col md:gap-2">
                <Skeleton className="h-16 w-16 shrink-0 rounded-xl md:h-16 md:w-full" />
                <Skeleton className="h-16 w-16 shrink-0 rounded-xl md:h-16 md:w-full" />
                <Skeleton className="h-16 w-16 shrink-0 rounded-xl md:h-16 md:w-full" />
              </div>
              <Skeleton className="order-1 min-h-[240px] flex-1 rounded-xl md:order-2 md:min-h-[320px]" />
            </div>

            <div className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-wrap items-start gap-3">
                <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-3">
                  <Skeleton className="h-9 w-full max-w-xl rounded-lg" />
                  <Skeleton className="h-5 w-48 rounded" />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 border-b border-slate-100 pb-6">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-5 w-32 rounded" />
                <Skeleton className="h-5 w-36 rounded" />
              </div>
              <div className="space-y-3 pt-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-[94%] rounded" />
                <Skeleton className="h-4 w-[88%] rounded" />
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <Skeleton className="mb-4 h-6 w-40 rounded-lg" />
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <Skeleton className="mb-4 h-6 w-48 rounded-lg" />
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
              <Skeleton className="mt-6 h-[200px] w-full rounded-xl" />
              <Skeleton className="mt-4 h-11 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
