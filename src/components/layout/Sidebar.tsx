import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { visibleNav } from '../nav';
import { Logo } from './Logo';
import { C } from '../../lib/theme';

function initials(nom: string): string {
  return nom
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar() {
  const { profil, role, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const sections = role ? visibleNav(role) : [];
  const userInitials = profil ? initials(profil.nom) : '?';

  return (
    <>
      {/* Logo */}
      <div
        className="px-5 py-5 border-b flex items-center justify-between"
        style={{ borderColor: C.primaryDark }}
      >
        <Logo size={36} showText />
      </div>

      {/* Role banner */}
      <div
        className="px-3 py-2.5 border-b"
        style={{ borderColor: C.primaryDark, backgroundColor: 'rgba(0,0,0,0.15)' }}
      >
        <div
          className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold"
          style={{ color: C.accent }}
        >
          <span>Connecté en mode</span>
        </div>
        <div className="text-sm font-bold text-white mt-0.5">{profil?.role ?? '—'}</div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.section}>
            <div
              className="px-3 mb-1.5 text-[9px] uppercase tracking-[0.2em] font-bold"
              style={{ color: 'rgba(201, 169, 97, 0.7)' }}
            >
              {section.section}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.path === '/'}
                  className="w-full flex items-center gap-3 px-3 py-2.5 lg:py-2 rounded text-[13px] font-medium transition-all"
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? C.primaryDark : 'transparent',
                    color: isActive ? C.accent : 'rgba(255,255,255,0.78)',
                  })}
                >
                  <item.icon size={15} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{
                        backgroundColor: item.badgeColor ?? C.accent,
                        color: item.badgeColor === C.danger ? 'white' : C.primary,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.alert !== undefined && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: C.danger, color: 'white' }}
                    >
                      {item.alert}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t relative" style={{ borderColor: C.primaryDark }}>
        {showMenu && (
          <div
            className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-lg shadow-2xl overflow-hidden"
            style={{ border: `1px solid ${C.border}` }}
          >
            <button
              onClick={() => { void signOut(); setShowMenu(false); }}
              className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-stone-50 text-left"
              style={{ backgroundColor: C.dangerSoft }}
            >
              <LogOut size={14} style={{ color: C.danger }} />
              <span className="text-xs font-bold" style={{ color: C.danger }}>
                Déconnexion
              </span>
            </button>
          </div>
        )}

        <button
          onClick={() => setShowMenu((v) => !v)}
          className="w-full flex items-center gap-3 px-2 py-2 rounded transition-colors"
          style={{ backgroundColor: showMenu ? 'rgba(0,0,0,0.2)' : 'transparent' }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: C.accent, color: C.primary }}
          >
            {userInitials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-bold text-white truncate">{profil?.nom ?? '—'}</div>
            <div className="text-[10px] truncate" style={{ color: C.accent }}>
              {profil?.role ?? ''}
            </div>
          </div>
          <ChevronDown
            size={14}
            style={{
              color: 'rgba(255,255,255,0.5)',
              transform: showMenu ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
            }}
          />
        </button>
      </div>
    </>
  );
}
