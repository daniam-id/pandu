import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

/**
 * Root layout rendered by every route (wraps <Outlet />).
 * Pages decide their own inner grid (DashboardPage uses three-panel,
 * SimulatorPage uses a centered card, etc.).
 */
export default function AppShell() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface text-text-primary">
      <Navbar />
      <main role="main" className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
