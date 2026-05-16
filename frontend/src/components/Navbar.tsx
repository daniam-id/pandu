import { Link, NavLink } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConnectionStatus } from './ConnectionStatus';
import { AIEngineStatus } from './AIEngineStatus';
import { TrafficSimButton } from './TrafficSimButton';
import { MobileNav } from './MobileNav';

/**
 * Top navigation bar.
 * Cycle 8: live ConnectionStatus + AIEngineStatus badges, MobileNav hamburger.
 */
export default function Navbar() {
  return (
    <header
      role="banner"
      className="h-14 shrink-0 border-b border-black/20 bg-brand-primary text-text-inverse px-4 sm:px-6 flex items-center justify-between gap-4 shadow-md"
    >
      <div className="flex items-center gap-3">
        <MobileNav />

        <Link
          to="/"
          className="flex items-center gap-2 font-semibold tracking-tight rounded-sm"
          aria-label="Pandu.ai — go to dashboard"
        >
          <MapPin className="w-5 h-5 text-brand-accent" aria-hidden="true" />
          <span>Pandu.ai</span>
          <span className="text-xs text-text-inverse/70 font-normal hidden sm:inline">
            Dispatcher
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden sm:flex items-center gap-1 text-sm">
          <NavItem to="/">Dashboard</NavItem>
          <NavItem to="/simulator">Simulator</NavItem>
        </nav>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <ConnectionStatus />
        <AIEngineStatus />
        <TrafficSimButton />
      </div>
    </header>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'px-3 py-1.5 rounded-sm transition-colors',
          'hover:bg-brand-primary-hover',
          isActive ? 'bg-brand-primary-hover text-brand-accent' : 'text-text-inverse/80',
        )
      }
    >
      {children}
    </NavLink>
  );
}
