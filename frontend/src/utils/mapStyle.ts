type MapStyler = { color?: string; visibility?: string; weight?: number };
type MapTypeStyle = {
  featureType?: string;
  elementType?: string;
  stylers: MapStyler[];
};

/**
 * Google Maps custom style — Pandu.ai brand palette.
 *
 * High-contrast roads, cyan water, green parks, hidden POI clutter.
 * Pairs with CSS custom properties in `src/styles/index.css`.
 */
export const panduMapStyle: MapTypeStyle[] = [
  // Base land
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#f8f9fa' }],
  },
  // Water — brand cyan
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#a8d8ea' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5a8fa8' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ffffff' }],
  },
  // Parks / nature — brand accent green
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#c7e9b0' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3d6b2a' }],
  },
  // Roads — high contrast
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d4d7dc' }, { weight: 1 }],
  },
  // Local roads — subtle
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [{ color: '#f5f6f8' }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e5e7eb' }, { weight: 0.5 }],
  },
  // Highways — warm yellow for visibility
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#ffe08a' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e0a92e' }, { weight: 1.5 }],
  },
  // Arterial roads
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d4d7dc' }, { weight: 1 }],
  },
  // Labels
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#1f2937' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ffffff' }, { weight: 2 }],
  },
  // Transit — muted
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#f3f4f6' }],
  },
  // Buildings
  {
    featureType: 'poi.business',
    elementType: 'geometry',
    stylers: [{ color: '#eceef1' }],
  },
  // Hide unnecessary POI clutter
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.business',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];
