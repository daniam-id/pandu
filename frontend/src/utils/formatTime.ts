/**
 * Format a Firestore Timestamp or JS Date as a relative string.
 *
 * Examples:
 *   - "just now" (< 60 seconds)
 *   - "2m ago"
 *   - "1h ago"
 *   - "Yesterday"
 *   - "Mon, 12 May"
 */
export function formatRelative(ts: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - ts.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(ts, yesterday)) return 'Yesterday';

  // Same year: "Mon, 12 May"
  if (ts.getFullYear() === now.getFullYear()) {
    return ts.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  // Different year
  return ts.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a Firestore Timestamp or JS Date as a clock string.
 * "14:32" or "02:32 PM" depending on locale.
 */
export function formatClock(ts: Date): string {
  return ts.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Check whether two dates fall on the same calendar day.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Format a date as a group key for log clustering.
 * Returns "Today", "Yesterday", or a locale date string.
 */
export function formatGroupKey(ts: Date): string {
  const now = new Date();
  if (isSameDay(ts, now)) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(ts, yesterday)) return 'Yesterday';

  return ts.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: ts.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}
