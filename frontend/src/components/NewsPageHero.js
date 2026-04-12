import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '../constants';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { newsSubscribeAPI } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';

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

function isSubscribeHref(href) {
  const h = String(href || '').trim();
  return !h || h === '__subscribe__' || h === '#subscribe' || h === '/news#subscribe';
}

export default function NewsPageHero({ settings }) {
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribeStep, setSubscribeStep] = useState('email'); // 'email' | 'confirm' | 'result'
  const [resultMessage, setResultMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!subscribeOpen) {
      setSubscribeStep('email');
      setEmail('');
      setResultMessage('');
    }
  }, [subscribeOpen]);

  const raw = settings?.newsHeroImage?.trim();
  const bg =
    raw && (resolveMediaUrl(raw) || raw)
      ? resolveMediaUrl(raw) || raw
      : '/news.png';
  const headline = settings?.newsHeadline || 'Life, Business, and Community in Alberta.';
  const sub = settings?.newsSubhead || '';
  const cta1 = settings?.newsCtaPrimaryText || 'Subscribe for news';
  const cta1Href = settings?.newsCtaPrimaryLink ?? '__subscribe__';
  const cta2 = settings?.newsCtaSecondaryText || 'List your business';
  const cta2Href = settings?.newsCtaSecondaryLink || '/register';

  const primaryIsSubscribe = isSubscribeHref(cta1Href);

  const validateEmail = (em) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.trim());

  const goConfirm = (e) => {
    e?.preventDefault();
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSubscribeStep('confirm');
  };

  const submitSubscribe = async () => {
    const em = email.trim();
    if (!validateEmail(em)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await newsSubscribeAPI.subscribe(em);
      const msg =
        res.data?.message ||
        (res.data?.alreadySubscribed
          ? 'This email is already on our list.'
          : 'You’re subscribed!');
      setResultMessage(msg);
      setSubscribeStep('result');
      if (res.data?.alreadySubscribed) {
        toast.info(msg);
      } else {
        toast.success(msg);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not subscribe. Try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="relative flex min-h-[420px] flex-col justify-center md:min-h-[480px]" data-testid="news-page-hero">
        <div className="absolute inset-0">
          <img src={bg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/45 via-slate-800/35 to-slate-900/50" />
        </div>

        <div className="relative z-10 container mx-auto max-w-5xl px-4 py-16 text-center md:px-8 md:py-24">
          <h1 className="mx-auto max-w-4xl font-heading text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
            {headline}
          </h1>
          {sub ? (
            <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-white/95 md:text-lg">{sub}</p>
          ) : null}

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            {primaryIsSubscribe ? (
              <button
                type="button"
                onClick={() => setSubscribeOpen(true)}
                className="inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-md bg-white px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-900 shadow-lg transition-colors hover:bg-slate-100"
              >
                {cta1}
              </button>
            ) : (
              <CtaLink
                href={cta1Href}
                className="inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-md bg-white px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-900 shadow-lg transition-colors hover:bg-slate-100"
              >
                {cta1}
              </CtaLink>
            )}
            <CtaLink
              href={cta2Href || ROUTES.LISTINGS}
              className="inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-md bg-spruce-700 px-6 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-lg transition-colors hover:bg-spruce-700"
            >
              {cta2}
            </CtaLink>
          </div>
        </div>
      </section>

      <Dialog open={subscribeOpen} onOpenChange={setSubscribeOpen}>
        <DialogContent className="sm:max-w-md" data-testid="news-subscribe-dialog">
          {subscribeStep === 'email' ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Subscribe for news</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-slate-600">
                Enter your email. On the next step you can confirm before we add you to the list.
              </p>
              <form onSubmit={goConfirm} className="mt-4 flex flex-col gap-3">
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
                <Button type="submit" className="h-11 bg-spruce-700 hover:bg-spruce-800">
                  Continue
                </Button>
              </form>
            </>
          ) : null}

          {subscribeStep === 'confirm' ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Confirm subscription</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-slate-600">
                We’ll email you at <span className="font-semibold text-slate-900">{email.trim()}</span> whenever a new
                article is published. Confirm to finish.
              </p>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setSubscribeStep('email')} disabled={submitting}>
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={submitSubscribe}
                  disabled={submitting}
                  className="bg-spruce-700 hover:bg-spruce-800"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm subscription'}
                </Button>
              </div>
            </>
          ) : null}

          {subscribeStep === 'result' ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">All set</DialogTitle>
              </DialogHeader>
              <div className="flex gap-3 rounded-lg border border-spruce-100 bg-spruce-50/80 p-4 text-sm text-slate-800">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-spruce-700" aria-hidden />
                <p>{resultMessage}</p>
              </div>
              <Button type="button" className="mt-4 w-full bg-spruce-700 hover:bg-spruce-800" onClick={() => setSubscribeOpen(false)}>
                Close
              </Button>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
