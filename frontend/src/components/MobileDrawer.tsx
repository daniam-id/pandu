import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface MobileDrawerProps {
  side: 'left' | 'right';
  triggerIcon: React.ReactNode;
  triggerLabel: string;
  triggerClassName?: string;
  children: React.ReactNode;
  title?: string;
}

/**
 * Responsive drawer that renders children inline on desktop (lg+),
 * and wraps them in a shadcn Sheet on mobile/tablet (< lg).
 *
 * Use inside the map section of DashboardPage so the floating trigger
 * overlays the live map.
 */
export function MobileDrawer({
  side,
  triggerIcon,
  triggerLabel,
  triggerClassName,
  children,
  title,
}: MobileDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating trigger — hidden on desktop */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'lg:hidden absolute z-10 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-full bg-surface text-text-primary shadow-md border border-border hover:bg-surface-offset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
          triggerClassName,
        )}
        aria-label={title ?? triggerLabel}
      >
        {triggerIcon}
        <span className="hidden sm:inline text-sm font-medium">{triggerLabel}</span>
      </button>

      {/* Sheet drawer — mobile/tablet only */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={side}
          className="w-[85vw] sm:max-w-sm p-0 gap-0 overflow-hidden bg-surface"
        >
          <div className="h-full flex flex-col overflow-hidden">{children}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
