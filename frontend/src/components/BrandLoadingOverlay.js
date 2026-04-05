import { createPortal } from 'react-dom';
import BrandSpinner from './BrandSpinner';

/**
 * Full-screen branded loader — centered logo, subtle motion.
 * Use for checkout / external redirects via CheckoutLoadingProvider.
 */
export default function BrandLoadingOverlay({ open, label = 'Taking you to secure checkout…' }) {
  if (typeof document === 'undefined' || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950/82 backdrop-blur-md"
      role="alertdialog"
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
      data-testid="brand-loading-overlay"
    >
      <div className="flex flex-col items-center gap-8 px-6">
        <BrandSpinner size="lg" />
        <p className="max-w-xs text-center text-sm font-medium tracking-wide text-white/95">{label}</p>
      </div>
    </div>,
    document.body
  );
}
