import { useAuth } from '../../auth/AuthProvider';
import { C } from '../../lib/theme';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  direction: 'Direction',
  compta: 'Comptabilité',
  chef_prod: 'Chef de production',
  bureau_etudes: "Bureau d'études",
  operateur: 'Opérateur',
};

export function Topbar() {
  const { profil, role, signOut } = useAuth();

  return (
    <header
      className="flex items-center justify-end gap-4 px-6 py-3 border-b shrink-0"
      style={{ backgroundColor: C.bg, borderColor: C.border }}
    >
      {profil && (
        <div className="text-right">
          <p className="text-sm font-semibold" style={{ color: C.text }}>
            {profil.nom}
          </p>
          {role && (
            <p className="text-xs" style={{ color: C.textMuted }}>
              {ROLE_LABELS[role] ?? role}
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => void signOut()}
        className="rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-gray-50"
        style={{ borderColor: C.border, color: C.textMuted }}
      >
        Déconnexion
      </button>
    </header>
  );
}
