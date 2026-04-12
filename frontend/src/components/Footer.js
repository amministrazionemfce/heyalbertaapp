import { Link, useLocation } from 'react-router-dom';
import { Mountain, Mail, Phone } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import {
  ROUTES,
  FOOTER_QUICK_LINKS,
  FOOTER_VENDOR_LINKS,
  FOOTER_HEADINGS,
  directoryCategoryQuery,
  SITE_CONTACT,
  SITE_TAGLINE,
  SITE_LEGAL,
} from '../constants';
import { useCookieConsent } from './CookieConsentBanner';
import { useAuth } from '../lib/auth';

function FooterCookiePreferences() {
  const cookie = useCookieConsent();
  if (!cookie) return null;
  return (
    <button
      type="button"
      onClick={cookie.openManage}
      className="hover:text-white transition-colors"
      data-testid="footer-cookie-preferences"
    >
      Cookie preferences
    </button>
  );
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export default function Footer() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isHome = pathname === ROUTES.HOME;
  const topCategories = CATEGORIES.slice(0, 6);
  const footerBg = 'bg-spruce-700';
  const iconTileBg = 'bg-spruce-700';

  return (
    <footer className={`${footerBg} text-slate-300 border-t border-slate-100`} data-testid="footer">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center md:text-left">
          {/* Brand */}
          <div>
            <Link to={ROUTES.HOME} className="flex items-center gap-2 mb-4 justify-center md:justify-start">
              <div className={`w-9 h-9 ${iconTileBg} rounded-lg flex items-center justify-center`}>
                <Mountain className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-white">
                Hey <span className="text-secondary-500">Alberta</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-white/90 mb-6">
              {SITE_TAGLINE.FOOTER}
            </p>
            <div className="flex flex-col gap-2 text-sm items-center md:items-start">
              <a href={`mailto:${SITE_CONTACT.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4" /> {SITE_CONTACT.email}
              </a>
              <a href={SITE_CONTACT.phoneHref} className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4" /> {SITE_CONTACT.phoneDisplay}
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">{FOOTER_HEADINGS.QUICK_LINKS}</h4>
            <ul className="space-y-3 text-sm flex flex-col items-center md:items-start">
              {FOOTER_QUICK_LINKS.map((item) => (
                <li key={item.to + item.label}>
                  <Link to={item.to} onClick={scrollToTop} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">{FOOTER_HEADINGS.CATEGORIES}</h4>
            <ul className="space-y-3 text-sm flex flex-col items-center md:items-start">
              {topCategories.map(cat => (
                <li key={cat.id}>
                  <Link to={directoryCategoryQuery(cat.id)} onClick={scrollToTop} className="hover:text-white transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Vendors */}
          {user?.role !== 'user' && (
            <div>
              <h4 className="font-heading font-semibold text-white mb-4">{FOOTER_HEADINGS.FOR_VENDORS}</h4>
              <ul className="space-y-3 text-sm flex flex-col items-center md:items-start">
                {FOOTER_VENDOR_LINKS.map((item) => (
                  <li key={item.to + item.label}>
                    <Link to={item.to} onClick={scrollToTop} className="hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 text-white/90 mt-12 pt-8 flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 text-center">
          <p className="text-sm">
            {SITE_LEGAL.COPYRIGHT_LINE}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm md:justify-end">
            <a href={SITE_LEGAL.PRIVACY_HREF} className="hover:text-white transition-colors">
              {SITE_LEGAL.PRIVACY_LABEL}
            </a>
            <a href={SITE_LEGAL.TERMS_HREF} className="hover:text-white transition-colors">
              {SITE_LEGAL.TERMS_LABEL}
            </a>
            <FooterCookiePreferences />
          </div>
        </div>
      </div>
    </footer>
  );
}
