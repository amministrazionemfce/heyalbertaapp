import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';

export default function MaintenancePage({ message }) {
  const text =
    String(message || '').trim() ||
    'We are performing scheduled maintenance. Please check back soon.';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-6 py-16 text-center"
      data-testid="maintenance-page"
    >
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="font-heading text-lg font-bold text-spruce-800">Hey Alberta</p>
        <h1 className="mt-3 font-heading text-2xl font-bold text-slate-900">We&apos;ll be right back</h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">{text}</p>
        <p className="mt-6 text-xs text-slate-500">
          Site administrators can still{' '}
          <Link to={ROUTES.LOGIN} className="font-medium text-spruce-700 underline underline-offset-2">
            sign in
          </Link>{' '}
          to manage the site.
        </p>
      </div>
    </div>
  );
}
