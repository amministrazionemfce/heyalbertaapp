import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';
import { Mountain, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.user.role === 'admin') navigate('/admin');
      else if (res.user.role === 'vendor') navigate('/dashboard');
      else navigate('/');
    } catch (err) {
      if(err.response?.status === 401) {
        toast.error('Invalid email or password');
      } else {
        toast.error('Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="background.jpeg"
          alt="Professional handshake"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-end p-12">
          <div>
            <h2 className="font-heading text-3xl font-bold text-white mb-3">Welcome Back</h2>
            <p className="text-spruce-100 text-lg">Access your vendor dashboard and manage your listings.</p>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-10">
            <div className="w-9 h-9 bg-spruce-700 rounded-lg flex items-center justify-center">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-spruce-700">Hey <span className="text-secondary-500">Alberta</span></span>
          </Link>

          <h1 className="font-heading text-2xl font-bold text-slate-900 mb-2">Log in to your account</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Don't have an account? {' '}
            <Link to="/register" className="text-spruce-700 hover:underline font-medium">Sign up</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-1.5" data-testid="login-email" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required className="mt-1.5" data-testid="login-password" />
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