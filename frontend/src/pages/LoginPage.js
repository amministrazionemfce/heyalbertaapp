import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../lib/auth';
import { Mountain, Loader2, ArrowLeft } from 'lucide-react';
import { ROUTES } from '../constants';
import { getApiErrorLines } from '../lib/formatApiError';
import AuthFormError from '../components/AuthFormError';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = typeof location.state?.from === 'string' ? location.state.from : '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiErrorLines, setApiErrorLines] = useState([]);

  const clearApiError = () => setApiErrorLines([]);

  useEffect(() => {
    if (user) navigate(fromPath || ROUTES.HOME, { replace: true });
  }, [user, navigate, fromPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiErrorLines([]);
    setLoading(true);
    try {
      const res = await login(email, password);
      if (fromPath) {
        navigate(fromPath, { replace: true });
      } else if (res.user.role === 'admin') navigate(ROUTES.ADMIN);
      else if (res.user.role === 'vendor') navigate(ROUTES.DASHBOARD);
      else navigate(ROUTES.HOME);
    } catch (err) {
      setApiErrorLines(getApiErrorLines(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-200/90" data-testid="login-page">
      {/* Left - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative min-h-screen">
        <img
          src="background.jpeg"
          alt="Professional handshake"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/65" aria-hidden />
        <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12">
          <div className="max-w-lg text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4 drop-shadow-md">
              Welcome Back
            </h2>
            <p className="text-white/95 text-lg leading-relaxed drop-shadow-sm">
              Access your vendor dashboard and manage your listings.
            </p>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-100">
        <div className="w-full max-w-md">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-spruce-700 rounded-lg flex items-center justify-center">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-spruce-700">Hey <span className="text-secondary-500">Alberta</span></span>
          </Link>
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-spruce-700 mb-8" data-testid="login-back-home">
            <ArrowLeft className="w-4 h-4" /> Return to main page
          </Link>

          <h1 className="font-heading text-2xl font-bold text-slate-900 mb-2">Log in to your account</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Don't have an account? {' '}
            <Link to={ROUTES.REGISTER} className="text-spruce-700 hover:underline font-medium">Sign up</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
            <AuthFormError lines={apiErrorLines} data-testid="login-api-error" />

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearApiError();
                }}
                placeholder="you@example.com"
                required
                className="mt-1.5"
                data-testid="login-email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearApiError();
                }}
                placeholder="Enter password"
                required
                className="mt-1.5"
                data-testid="login-password"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-spruce-700 hover:bg-spruce-800 text-white" data-testid="login-submit-btn">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Log In
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Admin demo: admin@heyalberta.ca / admin123
          </p>
        </div>
      </div>
    </div>
  );
}