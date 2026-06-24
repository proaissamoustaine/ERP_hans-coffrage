import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spinner } from './components/ui/Spinner';
import { C } from './lib/theme';
import ProtectedRoute from './auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';

const LoginPage = lazy(() => import('./auth/LoginPage'));
const DashboardPage = lazy(() => import('./modules/dashboard/DashboardPage'));
const ComingSoonPage = lazy(() => import('./modules/ComingSoonPage'));
const ClientsPage = lazy(() => import('./modules/clients/ClientsPage'));

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.bgSoft }}>
      <Spinner />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected shell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route
              index
              element={
                <ProtectedRoute page="dashboard">
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="clients" element={<ProtectedRoute page="clients"><ClientsPage /></ProtectedRoute>} />
            <Route path="devis" element={<ProtectedRoute page="devis"><ComingSoonPage /></ProtectedRoute>} />
            <Route path="affaires" element={<ProtectedRoute page="affaires"><ComingSoonPage /></ProtectedRoute>} />
            <Route path="flashage" element={<ProtectedRoute page="flashage"><ComingSoonPage /></ProtectedRoute>} />
            <Route path="factures" element={<ProtectedRoute page="factures"><ComingSoonPage /></ProtectedRoute>} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
