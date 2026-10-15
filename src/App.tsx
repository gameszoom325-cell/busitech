import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppShell } from './components/layout/AppShell';
import { Loader2 } from 'lucide-react';

// Lazy-loaded route components for performance hygiene
const OverviewPage = lazy(() => import('./pages/OverviewPage').then(m => ({ default: m.OverviewPage })));
const UploadContractPage = lazy(() => import('./pages/UploadContractPage').then(m => ({ default: m.UploadContractPage })));
const ExtractionAnalysisPage = lazy(() => import('./pages/ExtractionAnalysisPage').then(m => ({ default: m.ExtractionAnalysisPage })));
const ObligationsPage = lazy(() => import('./pages/ObligationsPage').then(m => ({ default: m.ObligationsPage })));
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage').then(m => ({ default: m.ApprovalsPage })));
const ContractsListPage = lazy(() => import('./pages/ContractsListPage').then(m => ({ default: m.ContractsListPage })));
const ActivityLogPage = lazy(() => import('./pages/ActivityLogPage').then(m => ({ default: m.ActivityLogPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const AdminPortalPage = lazy(() => import('./pages/AdminPortalPage').then(m => ({ default: m.AdminPortalPage })));
const ForbiddenPage = lazy(() => import('./pages/ForbiddenPage').then(m => ({ default: m.ForbiddenPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

/**
 * Full-screen branded loading state shown while the app checks the session at startup.
 * Protected content must NEVER flash on screen before the check finishes.
 */
function FullBrandedLoadingScreen() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[var(--color-bg-page)] text-[var(--color-text-main)] p-6 select-none animate-in fade-in duration-150">
      <div className="flex flex-col items-center space-y-4 text-center max-w-sm">
        {/* Brand Tile */}
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)] text-white flex items-center justify-center font-extrabold text-xl shadow-lg ring-4 ring-[var(--color-primary-light)]">
          C2A
        </div>

        <div className="space-y-1">
          <div className="font-extrabold text-base tracking-tight text-[var(--color-text-main)]">
            Contract2Action AI
          </div>
          <div className="text-xs text-[var(--color-text-muted)] font-mono">
            VERIFYING_SECURE_SESSION...
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 text-xs text-[var(--color-primary-text)] font-medium">
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[var(--color-primary)]" />
          <span>Validating human-gate session token</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Protected Route Wrapper
 * Strictly gates any protected route. If signed out, captures intended URL and redirects to /login.
 */
function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullBrandedLoadingScreen />;
  }

  if (!user) {
    // Preserve requested path safely in location state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return (
      <AppShell>
        <ForbiddenPage />
      </AppShell>
    );
  }

  return <AppShell>{children}</AppShell>;
}

/**
 * Root Route Gate
 * Visiting / while signed out redirects to /login.
 * Visiting / while signed in redirects to /overview.
 */
function RootRouteGate() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullBrandedLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/overview" replace />;
}

/**
 * Public Route with Conditional Shell (e.g. 404 or 403)
 */
function ConditionalShellRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullBrandedLoadingScreen />;
  }

  if (user) {
    return <AppShell>{children}</AppShell>;
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--color-bg-page)] p-4">
      {children}
    </div>
  );
}

/**
 * Global 401 Unauthorized Event Bridge
 */
function GlobalAuthBridge() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleNavLogin = () => {
      navigate('/login', { replace: true, state: { message: 'Your session has expired. Please sign in again.' } });
    };
    window.addEventListener('c2a:navigate-login', handleNavLogin);
    return () => window.removeEventListener('c2a:navigate-login', handleNavLogin);
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <GlobalAuthBridge />
            <Suspense fallback={<FullBrandedLoadingScreen />}>
              <Routes>
                {/* Public Login Route */}
                <Route path="/login" element={<LoginPage />} />

                {/* Root Route Gate: / redirects to /login if signed out, /overview if signed in */}
                <Route path="/" element={<RootRouteGate />} />

                {/* Protected Dashboard & App Routes */}
                <Route
                  path="/overview"
                  element={
                    <ProtectedRoute>
                      <OverviewPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contracts"
                  element={
                    <ProtectedRoute>
                      <ContractsListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/upload"
                  element={
                    <ProtectedRoute>
                      <UploadContractPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contracts/:id/analysis"
                  element={
                    <ProtectedRoute>
                      <ExtractionAnalysisPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/obligations"
                  element={
                    <ProtectedRoute>
                      <ObligationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/approvals"
                  element={
                    <ProtectedRoute>
                      <ApprovalsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/activity"
                  element={
                    <ProtectedRoute>
                      <ActivityLogPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Portal (Strictly Admin-only) */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminPortalPage />
                    </ProtectedRoute>
                  }
                />

                {/* Public 403 Forbidden Route */}
                <Route
                  path="/403"
                  element={
                    <ConditionalShellRoute>
                      <ForbiddenPage />
                    </ConditionalShellRoute>
                  }
                />

                {/* Public 404 Not Found Route */}
                <Route
                  path="/404"
                  element={
                    <ConditionalShellRoute>
                      <NotFoundPage />
                    </ConditionalShellRoute>
                  }
                />

                {/* Fallback Catch-all: Route to 404 */}
                <Route
                  path="*"
                  element={
                    <ConditionalShellRoute>
                      <NotFoundPage />
                    </ConditionalShellRoute>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
