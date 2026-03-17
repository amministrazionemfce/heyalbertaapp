import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import { registerValidation } from '../validations/registerValidation';

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

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);
 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(initialValdationError);
    const errors = registerValidation(name, email, password, confirmPassword);
    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) {
      setValidationError(errors);
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password, role);
      
      if (role === 'vendor') navigate('/dashboard');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="register-page">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <div className="w-25 h-16 flex items-center justify-center">
              <img src="logo.png" alt="Hey Alberta Logo" className="w-full h-full object-cover" />
            </div>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-spruce-700 mb-8" data-testid="register-back-home">
            <ArrowLeft className="w-4 h-4" /> Return to main page
          </Link>

          <h1 className="font-heading text-2xl font-bold text-slate-900 mb-2">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Already have an account? {' '}
            <Link to="/login" className="text-spruce-700 hover:underline font-medium">Log in</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="register-form">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5" data-testid="register-name" />
            </div>
            {validationError.name && <p className="text-red-500 text-sm">{validationError.name}</p>}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                onChange={(e) => setEmail(e.target.value)} 
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
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5" 
                data-testid="register-password" />
            </div>
            {validationError.password && <p className="text-red-500 text-sm">{validationError.password}</p>}
            <div>
               <Label htmlFor="password">Confirm Password</Label>
               <Input 
                    id="password" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1.5" data-testid="register-password" />
            </div>
            {validationError.confirmPassword && <p className="text-red-500 text-sm">{validationError.confirmPassword}</p>}
            <div>
              <Label>I am a</Label>
              <Select value={role} onValueChange={setRole}>
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
        </div>
      </div>
       <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="background.jpeg"
          alt="Alberta landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-end p-12">
          <div>
            <h2 className="font-heading text-3xl font-bold text-white mb-3">Join Hey Alberta</h2>
            <p className="text-spruce-100 text-lg">Create an account to access the full directory or list your business.</p>
          </div>
        </div>
      </div>
    </div>
  );
}