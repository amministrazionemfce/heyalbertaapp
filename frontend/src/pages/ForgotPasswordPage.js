import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mountain, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '../constants';
import { getApiErrorLines } from '../lib/formatApiError';
import AuthFormError from '../components/AuthFormError';
import { authAPI } from '../lib/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token') || '';
  
  const [step, setStep] = useState(resetToken ? 'reset' : 'request'); // 'request' | 'reset' | 'success'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiErrorLines, setApiErrorLines] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  const clearApiError = () => setApiErrorLines([]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    clearApiError();
    setLoading(true);
    try {
      const res = await authAPI.requestPasswordReset({ email: email.trim() });
      setSuccessMessage(res.data?.message || 'Check your email for a password reset link.');
      setStep('success');
      setEmail('');
    } catch (err) {
      setApiErrorLines(getApiErrorLines(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearApiError();
    
    if (password !== confirmPassword) {
      setApiErrorLines(['Passwords do not match.']);
      return;
    }

    if (password.length < 6) {
      setApiErrorLines(['Password must be at least 6 characters.']);
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.resetPassword({
        token: resetToken,
        password,
      });
      setSuccessMessage(res.data?.message || 'Password reset successfully. You can now log in.');
      setStep('success');
      setTimeout(() => navigate(ROUTES.LOGIN), 2000);
    } catch (err) {
      setApiErrorLines(getApiErrorLines(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-200/90" data-testid="forgot-password-page">
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
              Reset Your Password
            </h2>
            <p className="text-white/95 text-lg leading-relaxed drop-shadow-sm">
              We'll help you regain access to your account securely.
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
          <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-spruce-700 mb-8" data-testid="forgot-password-back-login">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>

          {step === 'request' && (
            <>
              <h1 className="font-heading text-2xl font-bold text-slate-900 mb-2">Forgot your password?</h1>
              <p className="text-sm text-slate-600 mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleRequestReset} className="space-y-5" data-testid="forgot-password-request-form">
                <AuthFormError lines={apiErrorLines} data-testid="forgot-password-api-error" />

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
                    data-testid="forgot-password-email"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-11 bg-spruce-700 hover:bg-spruce-800 text-white" 
                  data-testid="forgot-password-submit-btn"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send Reset Link
                </Button>
              </form>
            </>
          )}

          {step === 'reset' && (
            <>
              <h1 className="font-heading text-2xl font-bold text-slate-900 mb-2">Create new password</h1>
              <p className="text-sm text-slate-600 mb-6">
                Enter your new password below.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-5" data-testid="forgot-password-reset-form">
                <AuthFormError lines={apiErrorLines} data-testid="forgot-password-reset-error" />

                <div>
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearApiError();
                    }}
                    placeholder="Enter new password"
                    required
                    className="mt-1.5"
                    data-testid="forgot-password-new-password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearApiError();
                    }}
                    placeholder="Confirm new password"
                    required
                    className="mt-1.5"
                    data-testid="forgot-password-confirm-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-11 bg-spruce-700 hover:bg-spruce-800 text-white" 
                  data-testid="forgot-password-reset-submit-btn"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Reset Password
                </Button>
              </form>
            </>
          )}

          {step === 'success' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 text-center">
                {resetToken ? 'Password Reset' : 'Email Sent'}
              </h2>
              <p className="text-sm text-slate-600 text-center">
                {successMessage}
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => navigate(ROUTES.LOGIN)} 
                  className="flex-1 h-11 bg-spruce-700 hover:bg-spruce-800 text-white"
                  data-testid="forgot-password-back-to-login-btn"
                >
                  Back to Login
                </Button>
                <Button 
                  onClick={() => navigate(ROUTES.HOME)} 
                  variant="outline"
                  className="flex-1 h-11"
                  data-testid="forgot-password-home-btn"
                >
                  Go Home
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
