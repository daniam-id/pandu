// Tujuan    : Utility helper for conditional Tailwind class merging
// Caller    : All UI components
// Dependensi: clsx, tailwind-merge
// Main Func : cn() — merges className strings with Tailwind conflict resolution
// Side Effects: None

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
