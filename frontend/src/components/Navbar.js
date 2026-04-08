import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu, User, LogOut, LayoutDashboard, ChevronDown, KeyRound, UserCircle, Plus, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Button } from './ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from './ui/dropdown-menu';
import { MAIN_NAV_LINKS, ROUTES } from '../constants';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { useAddListingClick } from '../hooks/useAddListingClick';
import UpgradeToVendorModal from './UpgradeToVendorModal';
import { siteAPI } from '../lib/api';

function navLinkIsActive(pathname, linkTo) {
  if (linkTo === ROUTES.HOME) return pathname === ROUTES.HOME;
  return pathname === linkTo || pathname.startsWith(`${linkTo}/`);
}

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { handleAddListingClick, upgradeModalProps } = useAddListingClick();
  const [systemNotification, setSystemNotification] = useState(null);

  const hasActiveMainNav = MAIN_NAV_LINKS.some((link) => navLinkIsActive(pathname, link.to));

  useEffect(() => {
    let cancelled = false;
    const fetchNotification = async () => {
      try {
        const r = await siteAPI.systemNotification();
        const n = r?.data?.notification || null;
        const dismissedId = typeof window !== 'undefined'
          ? window.localStorage.getItem('hey_alberta_dismissed_system_notification_id')
          : null;
        const shouldShow = n && n.message && String(n.id || '') !== String(dismissedId || '');
        if (!cancelled) setSystemNotification(shouldShow ? n : null);
      } catch {
        if (!cancelled) setSystemNotification(null);
      }
    };

    fetchNotification();
    const onUpdated = () => fetchNotification();
    window.addEventListener('system-notification-updated', onUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener('system-notification-updated', onUpdated);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };
  
  return (
    <nav className="z-50 bg-white/95 backdrop-blur-md border-b border-slate-200" data-testid="navbar">
      {systemNotification ? (
        <div
          className={
            systemNotification.variant === 'danger'
              ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-fuchsia-600 text-white border-b border-rose-200/50'
              : systemNotification.variant === 'warning'
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white border-b border-amber-200/40'
                : 'bg-gradient-to-r from-spruce-700 via-emerald-600 to-cyan-600 text-white border-b border-spruce-200/30'
          }
          data-testid="system-notification-banner"
        >
          <div className="relative py-2">
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none" aria-hidden>
              <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.9),transparent_45%),radial-gradient(circle_at_80%_40%,rgba(255,255,255,0.8),transparent_50%),radial-gradient(circle_at_40%_80%,rgba(255,255,255,0.7),transparent_55%)]" />
            </div>
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-white/90 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label="Dismiss notification"
              onClick={() => {
                try {
                  window.localStorage.setItem(
                    'hey_alberta_dismissed_system_notification_id',
                    String(systemNotification.id || '')
                  );
                } catch {
                  /* ignore */
                }
                setSystemNotification(null);
              }}
              data-testid="system-notification-close"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            <div className="container mx-auto max-w-7xl px-3 sm:px-4 md:px-5 relative flex items-center justify-center">
              <p className="text-xs sm:text-sm font-semibold text-center px-12">
                {systemNotification.title ? (
                  <span className="font-extrabold tracking-wide">{systemNotification.title} </span>
                ) : null}
                <span className="font-medium">{systemNotification.message}</span>
              </p>
            </div>
          </div>
        </div>
      ) : null}
      <div className="container mx-auto max-w-7xl px-3 sm:px-4 md:px-5">
        <div className="relative flex min-h-[3.25rem] items-center justify-between gap-2 py-1 md:min-h-16 md:py-1">
          {/* Invalid Tailwind w-25 was ignored; object-contain avoids cropping the asset */}
          <Link
            to={ROUTES.HOME}
            className="relative z-10 group flex shrink-0 items-center"
            data-testid="navbar-logo"
          >
            <img
              src="/logo.png"
              alt="Hey Alberta Logo"
              className="h-11 w-auto max-w-[min(13.5rem,46vw)] object-contain object-left sm:h-12 md:h-14 md:max-w-[min(16rem,40vw)]"
            />
          </Link>

          {/* Desktop Nav — centered in the bar when no link is active; otherwise in normal flow */}
          <div
            className={
              hasActiveMainNav
                ? 'hidden md:flex items-end gap-2 md:gap-4 lg:gap-6'
                : 'pointer-events-none hidden md:absolute md:inset-x-0 md:top-0 md:bottom-0 md:flex md:items-end md:justify-center md:gap-2 md:gap-4 lg:gap-6 md:[&_a]:pointer-events-auto'
            }
          >
            {MAIN_NAV_LINKS.map((link) => {
              const isActive = navLinkIsActive(pathname, link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`border-b-2 px-2 pb-3 text-sm font-medium transition-colors -mb-px lg:px-3 ${
                    isActive
                      ? 'border-spruce-800 text-spruce-900'
                      : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-spruce-700'
                  }`}
                  data-testid={`nav-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Auth + Add Listings (desktop): action sits immediately left of login / user menu */}
          <div className="relative z-10 hidden md:flex shrink-0 items-center gap-3">
            <Button
              type="button"
              onClick={handleAddListingClick}
              className="gap-2 bg-spruce-700 hover:bg-spruce-800 text-white shadow-sm"
              data-testid="nav-add-listings-btn"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Add Listings
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu-trigger">
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden text-black-900 bg-white flex items-center justify-center shrink-0 bg-spruce-50"
                    >
                      {user.avatar_url ? (
                        <img
                          src={resolveMediaUrl(user.avatar_url) || user.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-sm font-medium">Hey, {user.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE)} data-testid="nav-profile">
                    <UserCircle className="w-4 h-4 mr-2" /> Profile
                  </DropdownMenuItem>
                  {(user.role === 'vendor' || user.role === 'admin') && (
                    <DropdownMenuItem onClick={() => navigate(ROUTES.DASHBOARD)} data-testid="nav-dashboard">
                      <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                    </DropdownMenuItem>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuItem
                        onClick={() => navigate(ROUTES.ADMIN)}
                        data-testid="nav-admin"
                        className={pathname.startsWith(ROUTES.ADMIN) ? 'text-admin-700 bg-admin-50 focus:bg-admin-50' : ''}
                      >
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
                <Button variant="ghost" onClick={() => navigate(ROUTES.LOGIN)} data-testid="nav-login-btn">
                  Log In
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
              <div className="flex flex-col items-center text-center gap-6 pt-6 px-4 pb-8 flex-1 overflow-auto">
                {MAIN_NAV_LINKS.map((link) => {
                  const isActive = navLinkIsActive(pathname, link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`w-full max-w-[16rem] border-b-2 pb-2 text-lg font-medium transition-colors ${
                        isActive
                          ? 'border-spruce-800 text-spruce-900'
                          : 'border-transparent text-slate-700 hover:border-slate-200 hover:text-spruce-800'
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <Button
                  type="button"
                  className={
                    'w-full max-w-[16rem] justify-center gap-2 bg-spruce-700 hover:bg-spruce-800 text-white shadow-sm'
                  }
                  onClick={() => {
                    handleAddListingClick();
                    setOpen(false);
                  }}
                  data-testid="nav-add-listings-btn-mobile"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  Add Listings
                </Button>
                <hr className="w-full max-w-[16rem] border-slate-200" />
                {user ? (
                  <>
                    <p className="text-sm text-muted-foreground">Signed in as {user.name}</p>
                    <Link
                      to={ROUTES.PROFILE}
                      className="text-lg font-medium w-full max-w-[16rem]"
                      onClick={() => setOpen(false)}
                    >
                      Profile
                    </Link>
                    {(user.role === 'vendor' || user.role === 'admin') && (
                      <Link
                        to={ROUTES.DASHBOARD}
                        className="text-lg font-medium w-full max-w-[16rem]"
                        onClick={() => setOpen(false)}
                      >
                        Dashboard
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link
                        to={ROUTES.ADMIN}
                        className={`text-lg font-medium w-full max-w-[16rem] ${pathname.startsWith(ROUTES.ADMIN) ? 'text-admin-700' : ''}`}
                        onClick={() => setOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      className="w-full max-w-[16rem]"
                      onClick={() => { handleLogout(); setOpen(false); }}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full max-w-[16rem]"
                      onClick={() => { navigate(ROUTES.LOGIN); setOpen(false); }}
                    >
                      Log In
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <UpgradeToVendorModal {...upgradeModalProps} />
    </nav>
  );
}