import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Loader2 } from 'lucide-react';
import ScrollToTop from './components/ScrollToTop';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import Landing from './pages/Landing'; // Public Home
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import DocumentList from './pages/Documents/DocumentList';
import DocumentViewer from './pages/Documents/DocumentViewer';
import History from './pages/History';
import ProfilePage from './pages/ProfilePage';
import ChecklistPage from './pages/Checklist';
import SharedChecklist from './pages/SharedChecklist';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmailPage from './pages/VerifyEmailPage';
import AuthActionHandler from './pages/AuthActionHandler';
import TermsAcceptancePage from './pages/TermsAcceptance';
import NotFound from './pages/NotFound';
import TasksPage from './pages/TasksPage';

import PlansPage from './pages/PlansPage';
import BillingPage from './pages/BillingPage';
import GuidePage from './pages/GuidePage';
import CollectCashPage from './pages/CollectCashPage';
import IntegrationsPage from './pages/IntegrationsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

// Route Guards
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#0B0F19]"><Loader2 className="animate-spin text-sky-500" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  // 1. Check Terms
  if (!user.termsAccepted && window.location.pathname !== '/accept-terms') {
    return <Navigate to="/accept-terms" replace />;
  }

  // 2. Check Onboarding (only if terms accepted)
  if (user.termsAccepted && !user.onboardingCompleted && window.location.pathname !== '/onboarding' && window.location.pathname !== '/accept-terms') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    if (!user.termsAccepted) {
      return <Navigate to="/accept-terms" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <Toaster position="top-center" />
        <ShadcnToaster />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/checklist/public/:id" element={<SharedChecklist />} />
          <Route path="/auth/action" element={<AuthActionHandler />} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Protected App Routes (Wrapped in DashboardLayout) */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/documents" element={<DocumentList />} />
            <Route path="/documents/:id" element={<DocumentViewer />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/checklist/:id" element={<ChecklistPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/new" element={<TasksPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
          </Route>

          {/* Standalone Protected Route (No Sidebar) */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/accept-terms" element={<ProtectedRoute><TermsAcceptancePage /></ProtectedRoute>} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/collect-cash" element={<CollectCashPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
//Cleared
export default App;
// Force Rebuild 2