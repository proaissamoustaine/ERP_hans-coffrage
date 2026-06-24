import { LayoutDashboard, Users, FileText, Briefcase, ScanLine, Receipt } from 'lucide-react';
import type { ComponentType } from 'react';
import { canAccess, type UserRole } from '../auth/roles';

export type NavItem = { id: string; label: string; path: string; icon: ComponentType<{ size?: number }> };

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', path: '/', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', path: '/clients', icon: Users },
  { id: 'devis', label: 'Devis', path: '/devis', icon: FileText },
  { id: 'affaires', label: 'Affaires', path: '/affaires', icon: Briefcase },
  { id: 'flashage', label: 'Flashage', path: '/flashage', icon: ScanLine },
  { id: 'factures', label: 'Factures', path: '/factures', icon: Receipt },
];

export function visibleNavItems(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((i) => canAccess(role, i.id));
}
