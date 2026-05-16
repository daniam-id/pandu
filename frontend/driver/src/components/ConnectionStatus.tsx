// Tujuan    : Online/offline indicator banner at top of screen
// Caller    : App.tsx (global overlay)
// Dependensi: react (useState, useEffect), lucide-react (WifiOff)
// Main Func : Shows sticky warning banner when navigator.onLine is false
// Side Effects: window online/offline event listeners

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-status-warning/90 text-white text-xs font-medium px-4 py-2 flex items-center justify-center gap-1.5 max-w-md mx-auto">
      <WifiOff size={14} />
      <span>Koneksi terputus — beberapa fitur mungkin tidak tersedia</span>
    </div>
  );
}
