import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { Toaster } from 'sonner';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import DirectoryPage from './pages/DirectoryPage';
import VendorDetailPage from './pages/VendorDetailPage';
import ListingDetailPage from './pages/ListingDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VendorDashboard from './pages/VendorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ResourceLibrary from './pages/ResourceLibrary';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import { ROUTES, ROUTE_PATTERNS } from './constants';

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
      <BrowserRouter>
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

          {/* Pages with nav */}
          <Route path={ROUTES.HOME} element={<Layout><HomePage /></Layout>} />
          <Route path={ROUTES.DIRECTORY} element={<Layout><DirectoryPage /></Layout>} />
          <Route path={ROUTE_PATTERNS.VENDOR_DETAIL} element={<Layout><VendorDetailPage /></Layout>} />
          <Route path={ROUTE_PATTERNS.LISTING_DETAIL} element={<Layout><ListingDetailPage /></Layout>} />
          <Route path={ROUTES.DASHBOARD} element={<Layout><VendorDashboard /></Layout>} />
          <Route path={ROUTES.ADMIN} element={<Layout><AdminDashboard /></Layout>} />
          <Route path={ROUTES.RESOURCES} element={<Layout><ResourceLibrary /></Layout>} />
          <Route path={ROUTES.ABOUT} element={<Layout><AboutPage /></Layout>} />
          <Route path={ROUTES.CONTACT} element={<Layout><ContactPage /></Layout>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App; 