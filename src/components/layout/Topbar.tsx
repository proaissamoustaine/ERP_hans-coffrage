import { useLocation } from 'react-router-dom';
import { ChevronRight, Search, Bell, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { findNavItem } from '../nav';
import { C } from '../../lib/theme';
import { roleLabel } from '../../auth/roles';

type TopbarProps = {
  onMenuClick?: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const { profil, signOut } = useAuth();
  const location = useLocation();

  const found = findNavItem(location.pathname);
  const breadcrumbSection = found?.section ?? '';
  const breadcrumbPage = found?.item.label ?? location.pathname;

  return (
    <header
      className="h-14 lg:h-16 px-4 lg:px-8 flex items-center justify-between border-b bg-white sticky top-0 z-30"
      style={{ borderColor: C.border }}
    >
      {/* Bouton hamburger — mobile uniquement */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Ouvrir le menu"
        className="lg:hidden p-2 -ml-2 rounded hover:bg-stone-100"
      >
        <Menu size={20} style={{ color: C.text }} />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm min-w-0">
        {breadcrumbSection && (
          <>
            <span className="hidden sm:inline font-medium truncate" style={{ color: C.textMuted }}>
              {breadcrumbSection}
            </span>
            <ChevronRight
              size={14}
              className="hidden sm:inline flex-shrink-0"
              style={{ color: C.textLight }}
            />
          </>
        )}
        <span className="font-bold truncate" style={{ color: C.text }}>
          {breadcrumbPage}
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
        {/* Role indicator pill */}
        {profil && (
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: C.primary + '15' }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: C.primary }}
            />
            <span
              className="text-[10px] uppercase tracking-wider font-bold"
              style={{ color: C.primary }}
            >
              {roleLabel(profil.role)}
            </span>
          </div>
        )}

        {/* Search box (cosmetic) */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded border w-56 lg:w-80"
          style={{ borderColor: C.border }}
        >
          <Search size={14} style={{ color: C.textMuted }} />
          <input
            className="flex-1 outline-none text-sm bg-transparent min-w-0"
            placeholder="Rechercher…"
            readOnly
          />
          <kbd
            className="hidden lg:inline text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{ backgroundColor: C.bgSoft, color: C.textMuted }}
          >
            ⌘K
          </kbd>
        </div>

        {/* Search icon mobile */}
        <button className="md:hidden p-2 rounded hover:bg-stone-100">
          <Search size={18} style={{ color: C.textMuted }} />
        </button>

        {/* Bell */}
        <button className="relative p-2 rounded hover:bg-stone-100">
          <Bell size={18} style={{ color: C.textMuted }} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: C.danger }}
          />
        </button>

        {/* Logout */}
        <button
          onClick={() => void signOut()}
          title="Déconnexion"
          className="hidden lg:block p-2 rounded hover:bg-stone-100"
        >
          <LogOut size={16} style={{ color: C.textMuted }} />
        </button>
      </div>
    </header>
  );
}
