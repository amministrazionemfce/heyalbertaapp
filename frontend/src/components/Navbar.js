import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu, User, LogOut, LayoutDashboard, ChevronDown, KeyRound, UserCircle, Plus } from 'lucide-react';
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

  const hasActiveMainNav = MAIN_NAV_LINKS.some((link) => navLinkIsActive(pathname, link.to));

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };
  
  return (
    <nav className="z-50 bg-white/95 backdrop-blur-md border-b border-slate-200" data-testid="navbar">
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