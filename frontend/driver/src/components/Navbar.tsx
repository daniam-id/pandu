// Tujuan    : Fixed bottom navigation bar with 4 tabs for the driver app
// Caller    : AppShell (layout wrapper)
// Dependensi: react-router-dom (useLocation, Link), lucide-react (Package, Map, TriangleAlert, User)
// Main Func : Renders 64px bottom nav with active state highlighting
// Side Effects: None

import { Link, useLocation } from 'react-router-dom';
import { Package, Map, TriangleAlert, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/orders', label: 'Orderan', icon: Package },
  { to: '/route', label: 'Rute', icon: Map },
  { to: '/report', label: 'Lapor', icon: TriangleAlert },
  { to: '/profile', label: 'Profil', icon: User },
];

export default function Navbar() {
  const location = useLocation();
  const path = location.pathname;

  const isActive = (to: string) => {
    if (to === '/orders') return path === '/' || path.startsWith('/orders');
    return path.startsWith(to);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-border flex items-center justify-around px-2 safe-area-pb">
      {tabs.map(({ to, label, icon: Icon }) => {
        const active = isActive(to);
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-md transition-colors',
              active ? 'text-brand-primary' : 'text-text-muted',
            )}
            aria-label={label}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
