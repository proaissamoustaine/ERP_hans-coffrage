export type UserRole = 'admin' | 'direction' | 'compta' | 'chef_prod' | 'bureau_etudes' | 'operateur';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  direction: 'Direction',
  compta: 'Comptabilité',
  chef_prod: 'Chef de production',
  bureau_etudes: "Bureau d'études",
  operateur: 'Opérateur',
};

export function roleLabel(role: string | null | undefined): string {
  return ROLE_LABELS[role as UserRole] ?? role ?? '—';
}

export const ROLE_PAGES: Record<UserRole, 'all' | string[]> = {
  admin: 'all',
  direction: 'all',
  compta: ['dashboard', 'clients', 'factures', 'heures', 'transport', 'rh', 'documents'],
  chef_prod: ['dashboard', 'affaires', 'chantiers', 'planning', 'formulaire', 'fiche-atelier', 'flashage', 'chutes', 'heures', 'photos', 'prix-revient', 'colisage', 'pesee', 'livraisons', 'impression', 'transport', 'stock', 'documents'],
  bureau_etudes: ['dashboard', 'clients', 'devis', 'chiffrage-devis', 'affaires', 'formulaire', 'photos', 'documents'],
  operateur: ['flashage', 'chutes', 'heures', 'colisage', 'pesee', 'impression', 'photos'],
};

export function canAccess(role: UserRole, page: string): boolean {
  const pages = ROLE_PAGES[role];
  return pages === 'all' || pages.includes(page);
}
