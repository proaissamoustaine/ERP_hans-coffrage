import { useAuth } from '../../auth/AuthProvider';
import { Card } from '../../components/ui/Card';
import { C } from '../../lib/theme';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  direction: 'Direction',
  compta: 'Comptabilité',
  chef_prod: 'Chef de production',
  bureau_etudes: "Bureau d'études",
  operateur: 'Opérateur',
};

export default function DashboardPage() {
  const { profil, role } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>
          Tableau de bord
        </h1>
        <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
          Bienvenue dans l'ERP Hans Coffrage
        </p>
      </div>

      <Card>
        <p className="text-lg font-semibold" style={{ color: C.text }}>
          Bonjour, {profil?.nom ?? '—'}
        </p>
        {role && (
          <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
            Rôle : <span style={{ color: C.primary }}>{ROLE_LABELS[role] ?? role}</span>
          </p>
        )}
      </Card>
    </div>
  );
}
