import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bike } from 'lucide-react';

interface CourierSimulatorButtonProps {
  onOpen: () => void;
}

const MOBILE_BREAKPOINT = 1024;

const sharedClasses =
  'inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-brand-primary text-white shadow-lg shadow-brand-primary/25 hover:bg-brand-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 transition-colors';

/**
 * Floating action button, bottom-center of the map view.
 * On desktop (<lg) opens the Courier Simulator dialog.
 * On mobile (>=lg) navigates to the standalone /simulator page.
 *
 * - 44 px min touch target
 * - Brand-primary background with white icon
 * - Subtle shadow for floating elevation
 * - Accessible: aria-label, focus-visible ring
 */
export function CourierSimulatorButton({ onOpen }: CourierSimulatorButtonProps) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return (
      <Link
        to="/simulator"
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-10 ${sharedClasses}`}
        aria-label="Open courier simulator"
      >
        <Bike className="w-5 h-5" aria-hidden="true" />
        <span className="text-sm font-medium">Report Obstacle</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-10 ${sharedClasses}`}
      aria-label="Open courier simulator"
    >
      <Bike className="w-5 h-5" aria-hidden="true" />
      <span className="text-sm font-medium">Report Obstacle</span>
    </button>
  );
}
