/**
 * Format a distance in meters to a human-readable string.
 *
 * - < 1 km → "450 m"
 * - ≥ 1 km → "1.2 km" (trailing `.0` stripped)
 */
export function formatDistance(meters: number): string {
  if (!isFinite(meters) || meters < 0) return '0 m';

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  const km = meters / 1000;
  return `${km.toFixed(1).replace(/\.0$/, '')} km`;
}
