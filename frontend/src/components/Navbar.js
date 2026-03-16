import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { Menu, User, LogOut, LayoutDashboard, ChevronDown, KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '../components/ui/dropdown-menu';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/directory', label: 'Listings' },
  { to: '/resources', label: 'Resources' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);


  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200" data-testid="navbar">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" data-testid="navbar-logo">
            <img 
            src="logo.png" 
            alt="Hey Alberta Logo" 
            className="w-25 h-16 object-cover" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => {
              const isActive =
                link.to === '/'
                  ? pathname === '/'
                  : pathname === link.to || pathname.startsWith(`${link.to}/`);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors border-b-2 border-transparent -mb-px pb-px
                    ${isActive ? 'text-red-900 font-bold' : 'text-slate-600 hover:text-spruce-600 border-transparent'}`}
                  data-testid={`nav-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3 bg-white-900">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu-trigger">
                    <div className="w-8 h-8 bg-spruce-50 rounded-full text-black-900 bg-white flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{user.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {(user.role === 'vendor' || user.role === 'admin') && (
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} data-testid="nav-dashboard">
                      <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                    </DropdownMenuItem>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/admin')} data-testid="nav-admin">
                        <KeyRound className="w-4 h-4 mr-2" /> Admin Panel
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout} data-testid="nav-logout">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')} data-testid="nav-login-btn">
                  Log In
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="bg-spruce-700 hover:bg-spruce-800 text-white"
                  data-testid="nav-register-btn"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" data-testid="mobile-menu-trigger">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 min-h-screen h-screen flex flex-col">
              <div className="flex flex-col gap-6 pt-6 px-4 pb-8 flex-1 overflow-auto">
                {NAV_LINKS.map(link => {
                  const isActive = pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`text-lg font-medium hover:text-red-900 ${isActive ? 'text-red-900 font-bold' : 'text-slate-700 hover:text-red-800'}`}
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <hr className="border-slate-200" />
                {user ? (
                  <>
                    <p className="text-sm text-muted-foreground">Signed in as {user.name}</p>
                    {(user.role === 'vendor' || user.role === 'admin') && (
                      <Link to="/dashboard" className="text-lg font-medium" onClick={() => setOpen(false)}>Dashboard</Link>
                    )}
                    {user.role === 'admin' && (
                      <Link to="/admin" className="text-lg font-medium" onClick={() => setOpen(false)}>Admin Panel</Link>
                    )}
                    <Button variant="outline" onClick={() => { handleLogout(); setOpen(false); }}>Logout</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => { navigate('/login'); setOpen(false); }}>Log In</Button>
                    <Button className="bg-spruce-700 text-white" onClick={() => { navigate('/register'); setOpen(false); }}>Get Started</Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}