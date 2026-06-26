import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { C } from '../../lib/theme';

export function AppShell() {
  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundColor: C.bgWarm,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      }}
    >
      {/* Sidebar — desktop only */}
      <aside
        className="hidden lg:flex w-64 flex-shrink-0 flex-col"
        style={{ backgroundColor: C.primary }}
      >
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
