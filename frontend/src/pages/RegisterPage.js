import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../lib/auth';
import { Loader2, ArrowLeft } from 'lucide-react';
import { getApiErrorLines } from '../lib/formatApiError';
import AuthFormError from '../components/AuthFormError';
import { registerValidation } from '../validations/registerValidation';
import { ROUTES } from '../constants';

const initialValdationError = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState(initialValdationError);
  const [apiErrorLines, setApiErrorLines] = useState([]);
  const [postRegisterMessage, setPostRegisterMessage] = useState('');

  useEffect(() => {
    if (user) navigate(ROUTES.HOME, { replace: true });
  }, [user, navigate]);
 

  const clearApiError = () => setApiErrorLines([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiErrorLines([]);
    setValidationError(initialValdationError);
    const errors = registerValidation(name, email, password, confirmPassword);
    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) {
      setValidationError(errors);
      return;
    }
    setLoading(true);
    try {
      setPostRegisterMessage('');
      const data = await register(name, email, password, role);
      if (data.requiresVerification && !data.token) {
        setPostRegisterMessage(data.message || 'Check your email to verify your account, then log in.');
        return;
      }
      if (role === 'vendor') navigate(ROUTES.DASHBOARD);
      else navigate(ROUTES.HOME);
    } catch (err) {
      setApiErrorLines(getApiErrorLines(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-200/90" data-testid="register-page">
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-100">
        <div className="w-full max-w-md">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 mb-6">
            <div className="w-25 h-16 flex items-center justify-center">
              <img src={`${process.env.PUBLIC_URL || ''}/logo.png`} alt="Hey Alberta Logo" className="w-full h-full object-cover" />
            </div>
          </Link>
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-spruce-700 mb-8" data-testid="register-back-home">
            <ArrowLeft className="w-4 h-4" /> Return to main page
          </Link>

          <h1 className="font-heading text-2xl font-bold text-slate-900 mb-2">Create your account</h1>
        

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="register-form">
            <AuthFormError lines={apiErrorLines} data-testid="register-api-error" />
            {postRegisterMessage ? (
              <p className="rounded-md border border-spruce-200 bg-spruce-50 px-3 py-2 text-sm text-spruce-900" role="status">
                {postRegisterMessage}{' '}
                <Link to={ROUTES.LOGIN} className="font-medium underline">
                  Log in
                </Link>{' '}
                after you verify.
              </p>
            ) : null}

            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => {
                  setName(e.target.value);
                  clearApiError();
                }}
                className="mt-1.5" data-testid="register-name" />
            </div>
            {validationError.name && <p className="text-red-500 text-sm">{validationError.name}</p>}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearApiError();
                }} 
                value={email} 
                className="mt-1.5" data-testid="register-email" />
            </div>
            {validationError.email && <p className="text-red-500 text-sm">{validationError.email}</p>}
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
                className="mt-1.5" 
                data-testid="register-password" />
            </div>
            {validationError.password && <p className="text-red-500 text-sm">{validationError.password}</p>}
            <div>
               <Label htmlFor="confirmPassword">Confirm Password</Label>
               <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearApiError();
                    }}
                    className="mt-1.5" data-testid="register-confirm-password" />
            </div>
            {validationError.confirmPassword && <p className="text-red-500 text-sm">{validationError.confirmPassword}</p>}
            <div>
              <Label>I am a</Label>
              <Select
                value={role}
                onValueChange={(v) => {
                  setRole(v);
                  clearApiError();
                }}
              >
                <SelectTrigger className="mt-1.5" data-testid="register-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Newcomer / User</SelectItem>
                  <SelectItem value="vendor">Vendor / Business Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-spruce-700 hover:bg-spruce-800 text-white" data-testid="register-submit-btn">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Account
            </Button>
          </form>
          <p className="text-sm text-muted-foreground mb-8 mt-4">
            Already have an account? {' '}
            <Link to={ROUTES.LOGIN} className="text-spruce-700 hover:underline font-medium">Log in</Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex lg:w-1/2 relative min-h-screen">
        <img
          src="background.jpeg"
          alt="Alberta landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/65" aria-hidden />
        <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12">
          <div className="max-w-lg text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4 drop-shadow-md">
              Join Hey Alberta
            </h2>
            <p className="text-white/95 text-lg leading-relaxed drop-shadow-sm">
              Create an account to access the full directory or list your business.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}