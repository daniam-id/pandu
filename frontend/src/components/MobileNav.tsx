import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

/**
 * Mobile hamburger navigation.
 *
 * Hidden on sm+ (where the desktop nav bar is visible).
 * Opens a left Sheet with Dashboard / Simulator links.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sm:hidden inline-flex items-center justify-center h-10 w-10 rounded-sm text-text-inverse hover:bg-brand-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" aria-hidden="true" />
      </button>

      <SheetContent side="left" className="w-[80vw] sm:max-w-xs p-0 gap-0 bg-surface">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="font-semibold text-text-primary">Menu</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-sm hover:bg-surface-offset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col p-2 gap-1" aria-label="Mobile primary">
            <MobileNavItem to="/" onClick={() => setOpen(false)}>
              Dashboard
            </MobileNavItem>
            <MobileNavItem to="/simulator" onClick={() => setOpen(false)}>
              Simulator
            </MobileNavItem>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileNavItem({
  to,
  children,
  onClick,
}: {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center px-3 py-3 rounded-sm text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-primary/10 text-brand-primary'
            : 'text-text-primary hover:bg-surface-offset',
        )
      }
    >
      {children}
    </NavLink>
  );
}
