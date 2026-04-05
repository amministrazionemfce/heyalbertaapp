import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { authAPI } from '../lib/api';
import { useAuth } from '../lib/auth';
import { ROUTES } from '../constants';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { applySession } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [message, setMessage] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (!token.trim() || token.length < 20) {
      setStatus('error');
      setMessage('This link is missing a valid token. Open the link from your email, or request a new one from the login page.');
      return;
    }
    if (ran.current) return;
    ran.current = true;

    authAPI
      .verifyEmail(token.trim())
      .then((res) => {
        applySession(res.data.token, res.data.user);
        setStatus('ok');
        setMessage(res.data.message || 'Your email is verified.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
            'Verification failed. The link may have expired — use “Resend verification” on the login page.'
        );
      });
  }, [token, applySession]);

  useEffect(() => {
    if (status !== 'ok') return;
    const t = setTimeout(() => {
      navigate(ROUTES.HOME, { replace: true });
    }, 1500);
    return () => clearTimeout(t);
  }, [status, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-100" data-testid="verify-email-page">
      <div className="w-full max-w-md text-center space-y-6">
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-spruce-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to log in
        </Link>
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-spruce-700" />
            <p className="text-slate-600">Verifying your email…</p>
          </div>
        )}
        {status === 'ok' && (
          <>
            <h1 className="font-heading text-2xl font-bold text-slate-900">You&apos;re all set</h1>
            <p className="text-slate-600">{message}</p>
            <p className="text-sm text-muted-foreground">Redirecting you home…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="font-heading text-2xl font-bold text-slate-900">Could not verify</h1>
            <p className="text-slate-600">{message}</p>
            <Button asChild className="bg-spruce-700 hover:bg-spruce-800">
              <Link to={ROUTES.LOGIN}>Go to log in</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
