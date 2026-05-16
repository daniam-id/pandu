// Tujuan    : Format Firestore timestamps into human-readable relative strings
// Caller    : OrderDetailPage (createdAt display), LiveLocationToggle (last update)
// Dependensi: None
// Main Func : formatTime(ts) -> "Baru saja", "5 menit lalu", "2 jam lalu", etc.
// Side Effects: None

import type { Timestamp } from 'firebase/firestore';

const UNITS: Array<[number, string]> = [
  [60, 'detik'],
  [60, 'menit'],
  [24, 'jam'],
  [7, 'hari'],
  [Infinity, 'minggu'],
];

export function formatTime(ts?: Timestamp): string {
  if (!ts) return '-';

  const now = Date.now();
  const then = ts.toMillis?.() ?? (ts as unknown as { seconds: number }).seconds * 1000;
  let diff = Math.floor((now - then) / 1000);

  if (diff < 10) return 'Baru saja';

  for (const [divisor, label] of UNITS) {
    if (diff < divisor) return `${diff} ${label} lalu`;
    diff = Math.floor(diff / divisor);
  }

  return `${diff} minggu lalu`;
}
