import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';
import { ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../lib/auth';

/**
 * Homepage "local business" call-to-action — light card style aligned with other homepage sections.
 * Only shown to non-logged-in users or vendors/admins.
 */
export default function HomeCtaSection({ onListBusiness }) {
  const { user } = useAuth();

  // Hide CTA from regular users; show to non-logged-in, vendors, and admins
  if (user?.role === 'user') {
    return null;
  }

  return (
    <section
      className="border-t border-slate-200/80 from-slate-50 via-white to-slate-50/90 py-20 md:py-28"
      data-testid="cta-section"
    >
      <div className="container mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200/90 bg-white p-8 text-center shadow-xl shadow-slate-200/40 ring-1 ring-slate-100 md:p-12 md:px-14">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-spruce-700">
            For businesses
          </p>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Are You a Local Business?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
            Join Hey Alberta and connect with thousands of newcomers looking for trusted services. Start with a free
            listing today.
          </p>
          <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:justify-center sm:gap-5">
            <Button
              type="button"
              onClick={onListBusiness}
              className="h-12 rounded-xl px-8 text-base font-semibold shadow-md transition bg-spruce-700 hover:bg-spruce-700 text-white hover:shadow-lg"
              data-testid="cta-register-btn"
            >
              List Your Business <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Button>
            <Link to={ROUTES.ABOUT} className="sm:inline-flex">
              <Button
                variant="outline"
                className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-8 text-base font-semibold text-slate-800 shadow-sm transition hover:border-spruce-300 hover:bg-spruce-50 hover:text-spruce-900 sm:w-auto"
                data-testid="cta-learn-more-btn"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
