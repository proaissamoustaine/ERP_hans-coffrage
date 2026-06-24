import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { visibleNavItems } from '../nav';
import { C } from '../../lib/theme';

export function Sidebar() {
  const { role } = useAuth();

  const items = role ? visibleNavItems(role) : [];

  return (
    <aside
      className="flex flex-col w-56 min-h-screen shrink-0"
      style={{ backgroundColor: C.primary }}
    >
      {/* Brand */}
      <div className="px-6 py-5 border-b" style={{ borderColor: C.primaryDark }}>
        <span className="text-base font-bold tracking-wide text-white">Hans Coffrage</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
              }`
            }
            style={({ isActive }) =>
              isActive ? { backgroundColor: C.primaryLight } : {}
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
