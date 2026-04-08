import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { Toaster } from 'sonner';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import DirectoryPage from './pages/DirectoryPage';
import {
  RedirectVendorsIndexToListings,
  RedirectVendorDetailToListings,
} from './components/VendorBrowseRedirects';
import ListingDetailPage from './pages/ListingDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import VendorDashboard from './pages/VendorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NewsPage from './pages/NewsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ProfilePage from './pages/ProfilePage';
import CheckoutContinuePage from './pages/CheckoutContinuePage';
import CheckoutReturnPage from './pages/CheckoutReturnPage';
import { CheckoutLoadingProvider } from './lib/checkoutLoadingContext';
import { CookieConsentProvider } from './components/CookieConsentBanner';
import { ROUTES, ROUTE_PATTERNS } from './constants';
import { ImpersonationHandoff } from './components/ImpersonationHandoff';
import { HashScroll } from './components/HashScroll';
import { MaintenanceGate } from './components/MaintenanceGate';

function Layout({ children, hideNav }) {
  return (
    <div className="min-h-screen flex flex-col">
      {!hideNav && <Navbar />}
      <main className="flex-1">{children}</main>
      {!hideNav && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CheckoutLoadingProvider>
      <CookieConsentProvider>
      <BrowserRouter>
        <MaintenanceGate>
        <ImpersonationHandoff />
        <HashScroll />
        <Toaster
          position="top-right"
          theme="light"
          unstyled
          toastOptions={{
            classNames: {
              toast: 'toast-sonner',
              title: 'toast-sonner-title',
              description: 'toast-sonner-description',
              closeButton: 'toast-sonner-close',
            },
          }}
          icons={{
            success: <CheckCircle2 className="toast-sonner-icon toast-sonner-icon-success" />,
            error: <XCircle className="toast-sonner-icon toast-sonner-icon-error" />,
            warning: <AlertCircle className="toast-sonner-icon toast-sonner-icon-warning" />,
            info: <Info className="toast-sonner-icon toast-sonner-icon-info" />,
          }}
        />
        <Routes>
          {/* Auth pages without nav */}
          <Route path={ROUTES.LOGIN} element={<Layout hideNav><LoginPage /></Layout>} />
          <Route path={ROUTES.REGISTER} element={<Layout hideNav><RegisterPage /></Layout>} />
          <Route path={ROUTES.VERIFY_EMAIL} element={<Layout hideNav><VerifyEmailPage /></Layout>} />
          <Route path={ROUTES.CHECKOUT} element={<Layout hideNav><CheckoutContinuePage /></Layout>} />
          <Route path={ROUTES.CHECKOUT_RETURN} element={<Layout hideNav><CheckoutReturnPage /></Layout>} />

          {/* Pages with nav */}
          <Route path={ROUTES.HOME} element={<Layout><HomePage /></Layout>} />
          <Route
            path={ROUTES.VENDORS}
            element={<Layout><RedirectVendorsIndexToListings /></Layout>}
          />
          <Route
            path={ROUTE_PATTERNS.VENDOR_DETAIL}
            element={<Layout><RedirectVendorDetailToListings /></Layout>}
          />
          <Route path={ROUTE_PATTERNS.LISTING_DETAIL} element={<Layout><ListingDetailPage /></Layout>} />
          <Route path={ROUTES.LISTINGS} element={<Layout><DirectoryPage /></Layout>} />
          <Route path={ROUTES.PROFILE} element={<Layout><ProfilePage /></Layout>} />
          <Route path={ROUTES.DASHBOARD} element={<Layout><VendorDashboard /></Layout>} />
          <Route path={ROUTES.ADMIN} element={<Layout><AdminDashboard /></Layout>} />
          <Route path={ROUTES.NEWS} element={<Layout><NewsPage /></Layout>} />
          <Route path={ROUTES.RESOURCES} element={<Navigate to={ROUTES.NEWS} replace />} />
          <Route path={ROUTES.ABOUT} element={<Layout><AboutPage /></Layout>} />
          <Route path={ROUTES.CONTACT} element={<Layout><ContactPage /></Layout>} />
        </Routes>
        </MaintenanceGate>
      </BrowserRouter>
      </CookieConsentProvider>
      </CheckoutLoadingProvider>
    </AuthProvider>
  );
}

export default App; 