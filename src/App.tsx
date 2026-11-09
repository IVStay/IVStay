import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PropertyProvider } from './context/PropertyContext';
import { BookingProvider } from './context/BookingContext';
import { ToastProvider } from './context/ToastContext';

import { SiteHeader } from './components/layout/SiteHeader';
import { HomePage } from './pages/HomePage';

// Public Pages

// Stay listing + detail pages (property links across the site point to /stays/:id)
import { ListingsPage } from './pages/ListingsPage';
import { PropertyDetailsPage } from './pages/PropertyDetailsPage';
import { ScrollToTop } from './components/ScrollToTop';
import { SignInPage } from './pages/SignInPage';
import { AccountPage } from './pages/AccountPage';
import { PrivacyPage } from './pages/legal/PrivacyPage';
import { TermsPage } from './pages/legal/TermsPage';
import { CancellationPage } from './pages/legal/CancellationPage';
import { SiteFooter } from './components/public/SiteFooter';

// Admin Protected Layout & Pages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminPropertiesPage } from './pages/admin/AdminPropertiesPage';
import { AdminPropertyWizardPage } from './pages/admin/AdminPropertyWizardPage';
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminEnquiriesPage } from './pages/admin/AdminEnquiriesPage';
import { ContactPage } from './pages/ContactPage';
import { AboutPage } from './pages/AboutPage';
import { DestinationsPage } from './pages/DestinationsPage';
import { GuidesPage, GuideArticlePage } from './pages/GuidesPage';
import { CategoryPage } from './pages/CategoryPage';
import { SavedPage } from './pages/SavedPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Old /villas/:id and /hotels/:id links go to the single canonical stay page.
const RedirectToStay: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/stays/${id}`} replace />;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      {!isAdminRoute && <SiteHeader />}

      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route
            path="/villas"
            element={
              <CategoryPage
                eyebrow="Villas & BnBs"
                title="Villas, BnBs and home stays"
                intro="Whole homes and cosy BnBs for families and friends, each one chosen for its setting and comfort."
                match={(p) => p.category !== 'hotels'}
              />
            }
          />
          <Route
            path="/hotels"
            element={
              <CategoryPage
                eyebrow="Hotels & Resorts"
                title="Boutique hotels and resorts"
                intro="Small hotels and resorts with proper service, picked for character rather than size."
                match={(p) => p.category === 'hotels'}
              />
            }
          />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/blogs" element={<GuidesPage />} />
          <Route path="/blogs/:slug" element={<GuideArticlePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/stays" element={<ListingsPage />} />
          <Route path="/stays/:id" element={<PropertyDetailsPage />} />
          <Route path="/villas/:id" element={<RedirectToStay />} />
          <Route path="/hotels/:id" element={<RedirectToStay />} />

          {/* Customer accounts */}
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/account" element={<AccountPage />} />

          {/* Policies */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cancellation-policy" element={<CancellationPage />} />


          {/* Admin Authentication Screen */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Admin Console Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="enquiries" element={<AdminEnquiriesPage />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="properties" element={<AdminPropertiesPage />} />
            <Route path="properties/new" element={<AdminPropertyWizardPage />} />
            <Route path="properties/edit/:id" element={<AdminPropertyWizardPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {!isAdminRoute && <SiteFooter />}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <PropertyProvider>
        <BookingProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </ToastProvider>
        </BookingProvider>
      </PropertyProvider>
    </AuthProvider>
  );
}

export default App;
