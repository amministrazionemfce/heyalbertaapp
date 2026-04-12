import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES, DASHBOARD_ADD_LISTING } from '../constants';
import { Button } from '../components/ui/button';
import MembershipTiersSection from '../components/MembershipTiersSection';
import UpgradeToVendorModal from '../components/UpgradeToVendorModal';
import { useAddListingClick } from '../hooks/useAddListingClick';
import { useSEO } from '../hooks/useSEO';
import { siteAPI } from '../lib/api';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ArrowRight,
  CheckCircle2,
  Star,
  Facebook,
  Youtube,
  Sparkles,
  MapPin,
} from 'lucide-react';

function AboutMissionCarousel({ urls }) {
  const resolved = useMemo(
    () => urls.map((u) => resolveMediaUrl(u) || u),
    [urls]
  );
  const [i, setI] = useState(0);

  useEffect(() => {
    setI(0);
  }, [urls]);

  useEffect(() => {
    if (resolved.length <= 1) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % resolved.length), 5500);
    return () => clearInterval(t);
  }, [resolved.length]);

  return (
    <div className="absolute inset-0">
      {resolved.map((src, idx) => (
        <img
          key={`${idx}-${src}`}
          src={src}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            idx === i ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
          }`}
        />
      ))}
      {resolved.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-[3]">
          {resolved.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setI(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === i ? 'w-6 bg-white shadow-sm' : 'w-2 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Show image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SocialPlaceholder({ className }) {
  return (
    <div className={`flex justify-center gap-2 pt-2 ${className || ''}`}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:border-spruce-300 hover:text-spruce-700 transition-colors cursor-default">
        <Facebook className="h-4 w-4" aria-hidden />
      </span>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:border-spruce-300 hover:text-spruce-700 transition-colors cursor-default">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </span>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:border-spruce-300 hover:text-spruce-700 transition-colors cursor-default">
        <Youtube className="h-4 w-4" aria-hidden />
      </span>
    </div>
  );
}

export default function AboutPage() {
  const { handleAddListingClick, upgradeModalProps } = useAddListingClick();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);

  useSEO({
    title: 'About Hey Alberta',
    description: 'Learn about Hey Alberta\'s mission to connect newcomers with trusted local businesses across Alberta.',
  });

  const missionImageUrls = useMemo(() => {
    const raw = settings?.aboutMissionImages;
    if (!Array.isArray(raw)) return ['/background.jpeg'];
    const u = raw.map((s) => String(s ?? '').trim()).filter(Boolean);
    return u.length ? u : ['/background.jpeg'];
  }, [settings]);

  useEffect(() => {
    let cancelled = false;
    siteAPI
      .settings()
      .then((res) => {
        if (!cancelled) setSettings(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const heroRaw = settings?.aboutHeroImage?.trim();
  const heroSrc = heroRaw ? resolveMediaUrl(heroRaw) || heroRaw : '/lake.png';

  const handleListBusiness = () => {
    if (!user) {
      navigate(ROUTES.REGISTER);
      return;
    }
    if (user.role === 'vendor' || user.role === 'admin') {
      navigate(DASHBOARD_ADD_LISTING);
      return;
    }
    handleAddListingClick();
  };

  return (
    <div className="min-h-screen" data-testid="about-page">
      {/* Hero — all text centered */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <img src={heroSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-spruce-900/82" aria-hidden />
        <div className="relative z-10 container mx-auto px-4 md:px-8 max-w-7xl text-center">
          <div className="max-w-3xl mx-auto">
          
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-tight mb-6 text-balance">
              Connecting Newcomers and Local Companies Across Alberta.
            </h1>
            <p className="text-lg text-white leading-relaxed">
              Hey Alberta is the go-to platform for individuals and families relocating to Alberta. We connect newcomers with
              trusted local service providers across 16 essential categories, making the transition as smooth and
              stress-free as possible.
            </p>
          </div>
        </div>
      </section>

      {/* The Mission */}
      <section className="relative py-20 md:py-28 bg-white overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-spruce-50/80 blur-3xl" aria-hidden />
        <div className="container relative mx-auto px-4 md:px-8 max-w-7xl">
          <div className="text-center mx-auto mb-10 md:mb-12 max-w-5xl px-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-spruce-700 mb-4">The mission</p>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl font-bold text-slate-900 mb-8 text-balance leading-[1.28] sm:leading-[1.32] md:leading-[1.38] tracking-tight">
              Our Mission Is Simple: Make Moving to Alberta Easier for Everyone.
            </h2>
            <div className="max-w-3xl mx-auto space-y-5 text-base sm:text-lg text-slate-600 leading-relaxed">
              <p>
                Moving or settling in a new place can be overwhelming — from finding contractors and utilities to discovering the
                best places to live, shop, and connect.
              </p>
              <p>
                We created Hey Alberta to make that journey easier. Our goal is to connect people with local companies, honest
                reviews, and practical resources — all in one trusted platform.
              </p>
            </div>
          </div>

          <div className="max-w-5xl mx-auto mb-14 md:mb-16">
            <img
              src="/background.jpeg"
              alt=""
              className="w-full rounded-2xl object-cover max-h-[min(420px,55vh)] min-h-[220px] shadow-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 md:gap-x-14 gap-y-6 md:gap-y-7 max-w-4xl mx-auto w-full px-1">
            {['Verified local companies', 'Transparent reviews', 'Exclusive member discounts', 'Community recommendations'].map(
              (line) => (
                <div key={line} className="flex items-start gap-4">
                  <CheckCircle2
                    className="w-7 h-7 sm:w-8 sm:h-8 text-spruce-700 shrink-0 mt-0.5"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="font-heading text-xl sm:text-2xl font-semibold text-slate-800 leading-snug tracking-tight">
                    {line}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="text-center mb-12 md:mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-spruce-700 mb-3">3-step process</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: 'For Newcomers',
                steps: [
                  { n: 1, t: 'Search', d: 'Search trusted companies by city or category' },
                  { n: 2, t: 'Compare', d: 'Compare offers, reviews, and member deals' },
                  { n: 3, t: 'Contact', d: 'Contact directly or save to your account' },
                ],
                cta: 'Find services',
                href: ROUTES.LISTINGS,
              },
              {
                title: 'For Companies',
                steps: [
                  { n: 1, t: 'Register', d: 'Create your business profile' },
                  { n: 2, t: 'Add listing', d: 'Choose a listing plan that fits your goals' },
                  { n: 3, t: 'Get leads', d: 'Connect with ready-to-buy customers' },
                ],
                cta: 'List your business',
                onClick: handleListBusiness,
                isButton: true,
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8 flex flex-col"
              >
                <h3 className="font-heading font-bold text-lg text-slate-900 mb-8">{card.title}</h3>
                <div className="relative pl-2 flex-1">
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-spruce-200 rounded-full" aria-hidden />
                  <ul className="space-y-8">
                    {card.steps.map((s) => (
                      <li key={s.n} className="relative flex gap-4 pl-10">
                        <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-spruce-700 text-white text-sm font-bold shadow-sm ring-4 ring-white">
                          {s.n}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{s.t}</p>
                          <p className="text-sm text-slate-600 mt-1">{s.d}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-10 pt-2">
                  {card.isButton ? (
                    <Button
                      type="button"
                      onClick={card.onClick}
                      className="w-full sm:w-auto bg-slate-900 hover:bg-spruce-800 text-white uppercase tracking-wide text-xs font-semibold h-11 px-8"
                    >
                      {card.cta}
                    </Button>
                  ) : (
                    <Button asChild className="w-full sm:w-auto bg-slate-900 hover:bg-spruce-800 text-white uppercase tracking-wide text-xs font-semibold h-11 px-8">
                      <Link to={card.href}>{card.cta}</Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What makes us different */}
      <section className="relative py-20 md:py-28 bg-slate-50 overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 w-64 h-64 opacity-[0.12] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-spruce-400 to-transparent" aria-hidden />
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative order-2 lg:order-1 min-h-[320px] lg:min-h-[400px]">
              <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3] max-h-[420px] ring-1 ring-slate-900/5">
                <AboutMissionCarousel urls={missionImageUrls} />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-slate-900/35 via-transparent to-slate-900/10 pointer-events-none z-[2]"
                  aria-hidden
                />
              </div>
              <div className="absolute -bottom-4 left-4 right-4 sm:left-8 sm:right-auto sm:max-w-[85%] rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-900/5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-spruce-50 p-2.5">
                    <MapPin className="w-8 h-8 text-spruce-700" aria-hidden />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-slate-900 text-base">Alberta-first, always</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      Listings and resources curated for communities across the province.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 lg:-ml-4 lg:z-10">
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/10 p-8 md:p-10 flex flex-col justify-center relative -mt-4 lg:mt-0 lg:-translate-y-2 ring-1 ring-slate-900/5">
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mb-6">What Makes Us Different</h2>
                <ul className="space-y-4 text-slate-600 leading-relaxed">
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-spruce-700 shrink-0 mt-1" aria-hidden />
                    <span>
                      <strong className="text-slate-900">Verified listings:</strong> Every company is reviewed before going live.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-spruce-700 shrink-0 mt-1" aria-hidden />
                    <span>
                      <strong className="text-slate-900">Community feedback:</strong> Ratings and reviews are from real members.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-spruce-700 shrink-0 mt-1" aria-hidden />
                    <span>
                      <strong className="text-slate-900">Alberta-focused:</strong> Every listing, resource, and event is local — nothing generic or imported.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-spruce-700 shrink-0 mt-1" aria-hidden />
                    <span>
                      <strong className="text-slate-900">No hidden fees:</strong> Companies know exactly what they pay for.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-20 md:py-24 bg-slate-50 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%230f4c3a\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] pointer-events-none" aria-hidden />
        <div className="container relative mx-auto px-4 md:px-8 max-w-7xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-spruce-700 mb-3">Our testimonials</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900">What They Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                quote:
                  'Hey Alberta made our move so much easier. We found a great mover and a dentist within our first week — everything felt local and trustworthy.',
                name: 'Kevin Martin',
                initials: 'KM',
              },
              {
                quote:
                  'As a small business, the leads we get from the directory are real people who are ready to book. The platform is straightforward and professional.',
                name: 'Jessica Brown',
                initials: 'JB',
              },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-spruce-600 bg-spruce-50 text-spruce-800 font-heading font-bold text-sm shadow-sm mx-auto sm:mx-0">
                    {t.initials}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex gap-0.5 mb-3 text-red-600 justify-center sm:justify-start">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-5 h-5 fill-red-600 text-red-600" aria-hidden />
                      ))}
                    </div>
                    <p className="text-slate-600 leading-relaxed mb-4">{t.quote}</p>
                    <p className="font-semibold text-slate-900">{t.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the team */}
      {/* <section className="py-20 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-spruce-700 mb-3">Professional people</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Meet the People Behind Hey Alberta
            </h2>
            <p className="text-slate-600 leading-relaxed">
              We’re locals passionate about helping Alberta grow — one connection at a time.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Jessica Brown', role: 'Consultant' },
              { name: 'Alex Rivera', role: 'Partnerships' },
              { name: 'Sam Chen', role: 'Product' },
              { name: 'Maria Okonkwo', role: 'Community' },
            ].map((person, i) => (
              <div
                key={person.name}
                className={`group rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden text-center hover:shadow-md transition-shadow ${
                  i === 0 ? 'ring-1 ring-spruce-200' : ''
                }`}
              >
                <div className="h-40 bg-gradient-to-b from-spruce-100 to-slate-100 flex items-center justify-center border-b border-spruce-100/50">
                  <Users className="w-14 h-14 text-spruce-600/70" aria-hidden />
                </div>
                <div className="relative -mt-6 px-4 pb-6 pt-2 bg-white rounded-t-2xl mx-2 shadow-sm border border-slate-100">
                  <p className="font-heading font-bold text-slate-900">{person.name}</p>
                  <p className="text-sm text-slate-500 mt-1">{person.role}</p>
                  <SocialPlaceholder />
                </div>
                <div className="h-1 bg-gradient-to-r from-transparent via-spruce-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section> */}

      <MembershipTiersSection />

      {/* CTA */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="max-w-2xl mx-auto rounded-2xl bg-white border border-slate-200/90 shadow-lg shadow-slate-900/10 p-8 md:p-10 text-center ring-1 ring-slate-900/5">
            <h2 className="font-heading text-3xl font-bold text-slate-900 mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto leading-relaxed">
              Whether you're moving to Alberta or you're a local business, we'd love to have you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={ROUTES.LISTINGS}>
                <Button
                  variant="outline"
                  className="border-spruce-700 text-spruce-800 hover:bg-spruce-50 h-12 px-8"
                  data-testid="about-browse-btn"
                >
                  Browse Directory
                </Button>
              </Link>
              <Button
                onClick={handleAddListingClick}
                className="bg-spruce-700 hover:bg-spruce-800 text-white h-12 px-8"
                data-testid="about-register-btn"
              >
                List Your Business <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>
      <UpgradeToVendorModal {...upgradeModalProps} />
    </div>
  );
}
