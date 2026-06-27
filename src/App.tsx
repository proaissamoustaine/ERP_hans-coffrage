import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spinner } from './components/ui/Spinner';
import { C } from './lib/theme';
import ProtectedRoute from './auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { NAV } from './components/nav';

const LoginPage = lazy(() => import('./auth/LoginPage'));
const DashboardPage = lazy(() => import('./modules/dashboard/DashboardPage'));
const ClientsPage = lazy(() => import('./modules/clients/ClientsPage'));
const DevisPage = lazy(() => import('./modules/devis/DevisPage'));
const AffairesPage = lazy(() => import('./modules/affaires/AffairesPage'));
const FicheAffairePage = lazy(() => import('./modules/affaires/FicheAffairePage'));
const FormulairePage = lazy(() => import('./modules/formulaire/FormulairePage'));
const FlashagePage = lazy(() => import('./modules/flashage/FlashagePage'));
const ChutesPage = lazy(() => import('./modules/chutes/ChutesPage'));
const ColisagePage = lazy(() => import('./modules/colisage/ColisagePage'));
const PeseePage = lazy(() => import('./modules/colisage/PeseePage'));
const StubPage = lazy(() => import('./modules/StubPage'));
const LivraisonsPage = lazy(() => import('./modules/livraisons/LivraisonsPage'));
const TransportPage = lazy(() => import('./modules/livraisons/TransportPage'));

/** IDs that have real page implementations */
const BUILT_IDS = new Set(['dashboard', 'clients', 'devis', 'affaires', 'formulaire', 'flashage', 'chutes', 'colisage', 'pesee', 'livraisons', 'transport']);

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
            {/* Dashboard (index) */}
            <Route
              index
              element={
                <ProtectedRoute page="dashboard">
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Built pages */}
            <Route
              path="clients"
              element={<ProtectedRoute page="clients"><ClientsPage /></ProtectedRoute>}
            />
            <Route
              path="devis"
              element={<ProtectedRoute page="devis"><DevisPage /></ProtectedRoute>}
            />
            <Route
              path="affaires"
              element={<ProtectedRoute page="affaires"><AffairesPage /></ProtectedRoute>}
            />
            <Route
              path="affaires/:id"
              element={<ProtectedRoute page="affaires"><FicheAffairePage /></ProtectedRoute>}
            />
            <Route
              path="formulaire"
              element={<ProtectedRoute page="formulaire"><FormulairePage /></ProtectedRoute>}
            />
            <Route
              path="flashage"
              element={<ProtectedRoute page="flashage"><FlashagePage /></ProtectedRoute>}
            />
            <Route
              path="chutes"
              element={<ProtectedRoute page="chutes"><ChutesPage /></ProtectedRoute>}
            />
            <Route
              path="colisage"
              element={<ProtectedRoute page="colisage"><ColisagePage /></ProtectedRoute>}
            />
            <Route
              path="pesee"
              element={<ProtectedRoute page="pesee"><PeseePage /></ProtectedRoute>}
            />
            <Route
              path="livraisons"
              element={<ProtectedRoute page="livraisons"><LivraisonsPage /></ProtectedRoute>}
            />
            <Route
              path="transport"
              element={<ProtectedRoute page="transport"><TransportPage /></ProtectedRoute>}
            />

            {/* Stub routes for every other nav item */}
            {NAV.flatMap((section) => section.items)
              .filter((item) => !BUILT_IDS.has(item.id))
              .map((item) => {
                const path = item.path.replace(/^\//, '');
                return (
                  <Route
                    key={item.id}
                    path={path}
                    element={
                      <ProtectedRoute page={item.id}>
                        <StubPage />
                      </ProtectedRoute>
                    }
                  />
                );
              })}
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
