import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../constants';
import { billingAPI } from '../lib/api';

export default function CheckoutReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setError('Missing checkout session.');
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const { data } = await billingAPI.getCheckoutSessionStatus(sessionId);
        if (cancelled) return;

        if (data?.status === 'complete') {
          try {
            await billingAPI.syncSubscription();
          } catch {
            /* non-fatal */
          }
          sessionStorage.removeItem('hey_alberta_checkout_payload');
          navigate(`${ROUTES.HOME}?billing=success`, { replace: true });
          return;
        }

        if (data?.status === 'open') {
          navigate(ROUTES.CHECKOUT, { replace: true });
          return;
        }

        navigate(`${ROUTES.HOME}?billing=pending`, { replace: true });
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.message || 'Could not verify checkout.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 p-6">
        <p className="text-center text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.HOME, { replace: true })}
          className="text-sm font-semibold text-spruce-700 hover:underline"
        >
          Return home
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-sm text-slate-600">Confirming your subscription…</p>
    </div>
  );
}
