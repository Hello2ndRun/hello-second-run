import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import AdminLayout from './components/layout/AdminLayout';

// ─── Public Pages ───
import Landing from './pages/Landing';
import NotFound from './pages/NotFound';
import PublicAngebot from './pages/PublicAngebot';
import Impressum from './pages/Impressum';
import Datenschutz from './pages/Datenschutz';
import AGB from './pages/AGB';

// ─── Admin Pages ───
import AdminDashboard from './pages/admin/AdminDashboard';
import Partners from './pages/admin/Partners';
import PartnerNew from './pages/admin/PartnerNew';
import PartnerDetail from './pages/admin/PartnerDetail';
import Deals from './pages/admin/Deals';
import DealNew from './pages/admin/DealNew';
import DealDetail from './pages/admin/DealDetail';
import MhdKalkulator from './pages/admin/MhdKalkulator';
import Documents from './pages/admin/Documents';
import Settings from './pages/admin/Settings';
import Team from './pages/admin/Team';
import Donations from './pages/admin/Donations';

import Chatbot from './components/Chatbot';
import { ToastProvider } from './components/shared/Toast';

// ─── Partner Portal ───
import PartnerPortal from './pages/PartnerPortal';

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

      {/* ═══ Standard Pages (with Navbar/Footer) ═══ */}
      <Route path="/*" element={<StandardPages />} />
    </Routes>
  );
}

// ─── Standard pages with Navbar/Footer wrapper ───
function StandardPages() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/angebot/:id" element={<PublicAngebot />} />
          <Route path="/portal/:partnerId" element={<PartnerPortal />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="/agb" element={<AGB />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Chatbot />
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
