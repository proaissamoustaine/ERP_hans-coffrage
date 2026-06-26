import {
  LayoutDashboard,
  Building2,
  Calculator,
  FileText,
  Briefcase,
  Receipt,
  Hammer,
  Calendar,
  ClipboardList,
  CheckCircle2,
  ScanLine,
  Recycle,
  Clock,
  TrendingUp,
  Package,
  Scale,
  PackageCheck,
  Printer,
  Truck,
  Boxes,
  UserCog,
  FolderOpen,
  Users,
  Database,
  BookOpen,
  Image as ImageIcon,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { canAccess, type UserRole } from '../auth/roles';

export type NavItem = {
  id: string;
  label: string;
  path: string;
  icon: ComponentType<{ size?: number }>;
  badge?: number;
  badgeColor?: string;
  alert?: number;
};

export type NavSection = { section: string; items: NavItem[] };

import { C } from '../lib/theme';

export const NAV: NavSection[] = [
  {
    section: 'Pilotage',
    items: [
      { id: 'dashboard', label: 'Tableau de bord', path: '/', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Commercial',
    items: [
      { id: 'clients', label: 'Clients', path: '/clients', icon: Building2 },
      { id: 'chiffrage-devis', label: 'Chiffrage devis', path: '/chiffrage-devis', icon: Calculator },
      { id: 'devis', label: 'Devis', path: '/devis', icon: FileText },
      { id: 'affaires', label: 'Affaires', path: '/affaires', icon: Briefcase, badge: 8 },
      { id: 'factures', label: 'Factures', path: '/factures', icon: Receipt, badge: 1, badgeColor: C.danger },
    ],
  },
  {
    section: 'Production',
    items: [
      { id: 'chantiers', label: 'Chantiers', path: '/chantiers', icon: Hammer },
      { id: 'planning', label: 'Planning', path: '/planning', icon: Calendar },
      { id: 'formulaire', label: 'Formulaire', path: '/formulaire', icon: ClipboardList },
      { id: 'fiche-atelier', label: 'Fiche atelier', path: '/fiche-atelier', icon: CheckCircle2 },
      { id: 'flashage', label: 'Flashage', path: '/flashage', icon: ScanLine },
      { id: 'chutes', label: 'Chutes', path: '/chutes', icon: Recycle },
      { id: 'heures', label: 'Heures', path: '/heures', icon: Clock },
      { id: 'photos', label: 'Photos', path: '/photos', icon: ImageIcon },
      { id: 'prix-revient', label: 'Prix de revient', path: '/prix-revient', icon: TrendingUp },
    ],
  },
  {
    section: 'Logistique',
    items: [
      { id: 'colisage', label: 'Colisage', path: '/colisage', icon: Package },
      { id: 'pesee', label: 'Pesée', path: '/pesee', icon: Scale },
      { id: 'livraisons', label: 'Livraisons', path: '/livraisons', icon: PackageCheck, badge: 3 },
      { id: 'impression', label: 'Impression docs', path: '/impression', icon: Printer },
      { id: 'transport', label: 'Transport', path: '/transport', icon: Truck },
      { id: 'stock', label: 'Stock & Matériel', path: '/stock', icon: Boxes, alert: 3 },
    ],
  },
  {
    section: 'Administration',
    items: [
      { id: 'rh', label: 'RH & Salariés', path: '/rh', icon: UserCog },
      { id: 'documents', label: 'Documents', path: '/documents', icon: FolderOpen },
      { id: 'admin-utilisateurs', label: 'Utilisateurs', path: '/admin-utilisateurs', icon: Users },
      { id: 'admin-entreprise', label: 'Entreprise', path: '/admin-entreprise', icon: Building2 },
      { id: 'admin-referentiels', label: 'Référentiels', path: '/admin-referentiels', icon: Database },
    ],
  },
  {
    section: 'Aide',
    items: [
      { id: 'mode-operatoire', label: 'Mode opératoire', path: '/mode-operatoire', icon: BookOpen },
    ],
  },
];

/** Flat list of all nav items (for backward compat and tests) */
export const NAV_ITEMS: NavItem[] = NAV.flatMap((s) => s.items);

export function visibleNav(role: UserRole): NavSection[] {
  return NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) => canAccess(role, item.id)),
  })).filter((section) => section.items.length > 0);
}

/** @deprecated Use visibleNav — kept for existing callers */
export function visibleNavItems(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((i) => canAccess(role, i.id));
}

export function findNavItem(
  pathname: string
): { section: string; item: NavItem } | null {
  const normalised = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  for (const section of NAV) {
    for (const item of section.items) {
      const itemPath = item.path === '/' ? '/' : item.path.replace(/\/$/, '');
      if (itemPath === normalised) {
        return { section: section.section, item };
      }
    }
  }
  return null;
}
