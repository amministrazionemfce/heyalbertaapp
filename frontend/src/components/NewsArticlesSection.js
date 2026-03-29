import { useState, useRef, useCallback, useEffect } from 'react';
import { User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { resolveMediaUrl } from '../lib/mediaUrl';

function formatArticleDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NewsArticlesSection({ articles }) {
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
  }, [updateScroll, list.length]);

  const scrollBy = (delta) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  if (list.length === 0) {
    return (
      <section
        className="relative bg-gradient-to-b from-slate-100/90 via-white to-slate-50 py-12 md:py-16 border-b border-slate-200/80"
        data-testid="news-articles-section"
      >
        <div className="container mx-auto max-w-7xl px-4 md:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-spruce-800 mb-2">Stories & guides</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900">Featured articles</h2>
          <p className="mt-4 text-sm text-slate-500 max-w-md mx-auto">New articles will appear here soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative bg-gradient-to-b from-slate-100/90 via-white to-slate-50 py-14 md:py-20 border-b border-slate-200/80"
      data-testid="news-articles-section"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-spruce-200/60 to-transparent pointer-events-none" />

      <div className="container mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-spruce-800 mb-2">Stories & guides</p>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
            Featured articles
          </h2>
          <p className="mt-3 text-sm md:text-base text-slate-600">
            Tips, local highlights, and ideas for life in Alberta.
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => scrollBy(-360)}
            disabled={!canLeft}
            className="absolute left-0 top-1/2 z-20 -translate-y-1/2 -translate-x-1 md:-translate-x-3 hidden sm:flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md text-slate-700 hover:bg-spruce-50 hover:border-spruce-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Scroll articles left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(360)}
            disabled={!canRight}
            className="absolute right-0 top-1/2 z-20 -translate-y-1/2 translate-x-1 md:translate-x-3 hidden sm:flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md text-slate-700 hover:bg-spruce-50 hover:border-spruce-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Scroll articles right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-5 md:gap-6 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-1"
          >
            {list.map((a) => {
              const img =
                a.imageUrl && (resolveMediaUrl(a.imageUrl) || a.imageUrl)
                  ? resolveMediaUrl(a.imageUrl) || a.imageUrl
                  : '/services/1.jpg';
              const excerpt = (a.excerpt || a.content || '').replace(/\s+/g, ' ').trim().slice(0, 140);
              const dateLabel = formatArticleDate(a.publishedAt || a.createdAt);
              const author = a.authorLabel || 'heyalberta';
              const external = (a.linkUrl || '').trim() && /^https?:\/\//i.test(a.linkUrl.trim());

              return (
                <article
                  key={a.id}
                  className="group flex-shrink-0 w-[min(100%,320px)] sm:w-[300px] md:w-[340px] snap-start flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-900/5 transition-all duration-300 hover:shadow-xl hover:ring-spruce-200/40"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    {dateLabel ? (
                      <span className="absolute left-3 bottom-3 rounded-md bg-red-500 px-2.5 py-1 text-xs font-semibold text-white shadow">
                        {dateLabel}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                      <User className="w-4 h-4 shrink-0" aria-hidden />
                      <span>{author}</span>
                    </div>
                    <h3 className="mt-2 font-heading text-lg font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-spruce-900 transition-colors">
                      {a.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm text-slate-600 line-clamp-3 leading-relaxed">{excerpt}</p>
                    <div className="mt-4">
                      {external ? (
                        <Button
                          asChild
                          className="w-full rounded-lg bg-spruce-700 hover:bg-spruce-800 text-white font-semibold uppercase text-xs tracking-wide shadow-sm"
                        >
                          <a href={a.linkUrl.trim()} target="_blank" rel="noopener noreferrer">
                            Learn more
                          </a>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => setDialogArticle(a)}
                          className="w-full rounded-lg bg-spruce-700 hover:bg-spruce-800 text-white font-semibold uppercase text-xs tracking-wide shadow-sm"
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {dialogArticle ? (
            <>
              <DialogTitle className="font-heading text-xl pr-8">{dialogArticle.title}</DialogTitle>
              <div className="mt-4 text-sm text-slate-700 whitespace-pre-wrap">{dialogArticle.content}</div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
