// Tujuan    : Full-screen loading indicator for initial app load
// Caller    : AppShell or individual pages (optional)
// Dependensi: lucide-react (Loader2)
// Main Func : Centered spinner with "Memuat..." text
// Side Effects: None

import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Memuat...' }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <Loader2 size={32} className="text-brand-primary animate-spin" />
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}
