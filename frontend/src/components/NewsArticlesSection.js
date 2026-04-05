import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Skeleton } from './ui/skeleton';
import { resolveMediaUrl } from '../lib/mediaUrl';

function formatArticleDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function NewsArticleCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[min(100%,260px)] sm:w-[248px] md:w-[268px] snap-start flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-900/5">
      <Skeleton className="aspect-[4/3] w-full rounded-none rounded-t-2xl" />
      <div className="px-3 pt-2 pb-1">
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-1">
        <Skeleton className="h-5 w-full mt-2" />
        <Skeleton className="mt-2 h-5 w-[85%]" />
        <Skeleton className="h-3 w-full mt-3" />
        <Skeleton className="h-9 w-full mt-4 rounded-lg" />
      </div>
    </div>
  );
}

export default function NewsArticlesSection({ articles, loading = false }) {
  const [dialogArticle, setDialogArticle] = useState(null);
  const list = Array.isArray(articles) ? articles : [];

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
  }, [updateScroll, list.length, loading]);

  const scrollBy = (delta) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <section
        className="relative border-b border-slate-200/80 bg-white py-14 md:py-20"
        data-testid="news-articles-section"
      >
        <div className="container mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
            <Skeleton className="mx-auto mb-2 h-4 w-40" />
            <Skeleton className="mx-auto h-9 w-72 max-w-full sm:h-10" />
          </div>
          <div className="flex gap-4 overflow-hidden pb-3 md:gap-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <NewsArticleCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (list.length === 0) {
    return (
      <section
        className="relative border-b border-slate-200/80 bg-white py-12 md:py-16"
        data-testid="news-articles-section"
      >
        <div className="container mx-auto max-w-7xl px-4 text-center md:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-spruce-800">Stories & guides</p>
          <h2 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">Featured articles</h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-slate-500">New articles will appear here soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative border-b border-slate-200/80 bg-white py-14 md:py-20" data-testid="news-articles-section">
      <div className="absolute inset-x-0 top-0 pointer-events-none h-px bg-gradient-to-r from-transparent via-spruce-200/50 to-transparent" />

      <div className="container mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-spruce-800">Stories & guides</p>
          <h2 className="font-heading text-2xl font-bold leading-tight text-slate-900 sm:text-3xl md:text-4xl">
            Featured articles
          </h2>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => scrollBy(-300)}
            disabled={!canLeft}
            className="absolute left-0 top-1/2 z-20 hidden h-11 w-11 -translate-x-1 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition-colors hover:border-spruce-200 hover:bg-spruce-50 disabled:pointer-events-none disabled:opacity-30 sm:flex md:-translate-x-3"
            aria-label="Scroll articles left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(300)}
            disabled={!canRight}
            className="absolute right-0 top-1/2 z-20 hidden h-11 w-11 translate-x-1 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition-colors hover:border-spruce-200 hover:bg-spruce-50 disabled:pointer-events-none disabled:opacity-30 sm:flex md:translate-x-3"
            aria-label="Scroll articles right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-5 [&::-webkit-scrollbar]:hidden"
          >
            {list.map((a) => {
              const img =
                a.imageUrl && (resolveMediaUrl(a.imageUrl) || a.imageUrl)
                  ? resolveMediaUrl(a.imageUrl) || a.imageUrl
                  : '/services/1.jpg';
              const excerpt = (a.excerpt || a.content || '').replace(/\s+/g, ' ').trim().slice(0, 140);
              const dateLabel = formatArticleDate(a.publishedAt || a.createdAt);
              const external = (a.linkUrl || '').trim() && /^https?:\/\//i.test(a.linkUrl.trim());
              const hideText = Boolean(a.hideCardText);

              return (
                <article
                  key={a.id}
                  className="group flex w-[min(100%,260px)] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-900/5 transition-all duration-300 hover:shadow-xl hover:ring-spruce-200/40 sm:w-[248px] md:w-[268px]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                  {dateLabel ? (
                    <div className="border-b border-slate-100 px-3 py-2">
                      <span className="inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ">
                        {dateLabel}
                      </span>
                    </div>
                  ) : (
                    <div className="border-b border-slate-100 px-3 py-1" />
                  )}
                  <div className="flex flex-1 flex-col px-3 pb-3 pt-2">
                    {!hideText ? (
                      <>
                        <h3 className="font-heading line-clamp-2 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-spruce-900">
                          {a.title}
                        </h3>
                        {excerpt ? (
                          <p className="mt-2 line-clamp-1 flex-1 text-sm leading-relaxed text-slate-600">{excerpt}</p>
                        ) : null}
                      </>
                    ) : null}
                    <div className={hideText ? 'mt-0 flex-1' : 'mt-3'}>
                      {external ? (
                        <Button
                          asChild
                          className="h-9 w-full rounded-lg bg-spruce-700 text-xs font-semibold uppercase tracking-wide text-white shadow-sm hover:bg-spruce-800"
                        >
                          <a href={a.linkUrl.trim()} target="_blank" rel="noopener noreferrer">
                            Learn more
                          </a>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => setDialogArticle(a)}
                          className="h-9 w-full rounded-lg bg-spruce-700 text-xs font-semibold uppercase tracking-wide text-white shadow-sm hover:bg-spruce-800"
                        >
                          Learn more
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={!!dialogArticle} onOpenChange={(v) => !v && setDialogArticle(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          {dialogArticle ? (
            <>
              <DialogTitle className="pr-8 font-heading text-xl">{dialogArticle.title}</DialogTitle>
              <div className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{dialogArticle.content}</div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
