// Tujuan    : Format distances in meters to human-readable strings
// Caller    : TurnByTurn component, RoutePage
// Dependensi: None
// Main Func : formatDistance(meters) -> "450 m" or "1.2 km"
// Side Effects: None

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1).replace(/\.0$/, '')} km`;
}
