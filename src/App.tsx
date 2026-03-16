import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import AdminLayout from './components/layout/AdminLayout';

// ─── Public Pages (eager — critical path) ───
import QuickAngebot from './pages/QuickAngebot';
import NotFound from './pages/NotFound';

// ─── Lazy-loaded Pages (non-critical) ───
const Landing = React.lazy(() => import('./pages/Landing'));
const PublicAngebot = React.lazy(() => import('./pages/PublicAngebot'));
const Impressum = React.lazy(() => import('./pages/Impressum'));
const Datenschutz = React.lazy(() => import('./pages/Datenschutz'));
const AGB = React.lazy(() => import('./pages/AGB'));

// ─── Admin Pages (lazy — only loaded after login) ───
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const Partners = React.lazy(() => import('./pages/admin/Partners'));
const PartnerNew = React.lazy(() => import('./pages/admin/PartnerNew'));
const PartnerDetail = React.lazy(() => import('./pages/admin/PartnerDetail'));
const Deals = React.lazy(() => import('./pages/admin/Deals'));
const DealNew = React.lazy(() => import('./pages/admin/DealNew'));
const DealDetail = React.lazy(() => import('./pages/admin/DealDetail'));
const MhdKalkulator = React.lazy(() => import('./pages/admin/MhdKalkulator'));
const Documents = React.lazy(() => import('./pages/admin/Documents'));
const Settings = React.lazy(() => import('./pages/admin/Settings'));
const Team = React.lazy(() => import('./pages/admin/Team'));
const Donations = React.lazy(() => import('./pages/admin/Donations'));

const Chatbot = React.lazy(() => import('./components/Chatbot'));
import { ToastProvider } from './components/shared/Toast';

// ─── Partner Portal (lazy) ───
const PartnerPortal = React.lazy(() => import('./pages/PartnerPortal'));

// ─── Route Guard ───

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userRole, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" />;
  if (userRole !== 'admin' && userRole !== 'broker') return <Navigate to="/" />;
  return <AdminLayout>{children}</AdminLayout>;
};

/** Admin-only routes (Team, Settings) — brokers get redirected to dashboard */
const AdminOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userRole, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" />;
  if (userRole !== 'admin') return <Navigate to="/admin/dashboard" />;
  return <AdminLayout>{children}</AdminLayout>;
};

// ─── App Content ───

function AppContent() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* ═══ Admin Routes (own layout, no Navbar/Footer) ═══ */}
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/partners" element={<AdminRoute><Partners /></AdminRoute>} />
        <Route path="/admin/partners/new" element={<AdminRoute><PartnerNew /></AdminRoute>} />
        <Route path="/admin/partners/:id" element={<AdminRoute><PartnerDetail /></AdminRoute>} />
        <Route path="/admin/deals" element={<AdminRoute><Deals /></AdminRoute>} />
        <Route path="/admin/deals/new" element={<AdminRoute><DealNew /></AdminRoute>} />
        <Route path="/admin/deals/:id" element={<AdminRoute><DealDetail /></AdminRoute>} />
        <Route path="/admin/kalkulator" element={<AdminRoute><MhdKalkulator /></AdminRoute>} />
        <Route path="/admin/team" element={<AdminOnlyRoute><Team /></AdminOnlyRoute>} />
        <Route path="/admin/spenden" element={<AdminRoute><Donations /></AdminRoute>} />
        <Route path="/admin/documents" element={<AdminRoute><Documents /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminOnlyRoute><Settings /></AdminOnlyRoute>} />

        {/* ═══ Redirect old route ═══ */}
        <Route path="/angebot-erstellen" element={<Navigate to="/" replace />} />

        {/* ═══ Standard Pages (with Navbar/Footer) ═══ */}
        <Route path="/*" element={<StandardPages />} />
      </Routes>
    </Suspense>
  );
}

// ─── Standard pages with Navbar/Footer wrapper ───
function StandardPages() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20">
        <Routes>
          <Route path="/" element={<QuickAngebot />} />
          <Route path="/about" element={<Landing />} />
          <Route path="/angebot/:id" element={<PublicAngebot />} />
          <Route path="/portal/:partnerId" element={<PartnerPortal />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="/agb" element={<AGB />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Suspense fallback={null}><Chatbot /></Suspense>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <AppContent />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
