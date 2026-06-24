import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { canAccess } from './roles';
import { Spinner } from '../components/ui/Spinner';
import { C } from '../lib/theme';

type Props = {
  page?: string;
  children?: ReactNode;
};

export default function ProtectedRoute({ page, children }: Props) {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: C.bgSoft }}
      >
        <Spinner />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (page && role && !canAccess(role, page)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: C.bgSoft }}
      >
        <div
          className="rounded-2xl p-10 text-center shadow"
          style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
        >
          <p className="text-xl font-semibold" style={{ color: C.danger }}>
            Accès refusé
          </p>
          <p className="mt-2 text-sm" style={{ color: C.textMuted }}>
            Vous n'avez pas les droits nécessaires pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return children ?? <Outlet />;
}
