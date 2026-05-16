import { useState, useMemo, useCallback } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import type { Courier } from '@/types/domain';
import { MarkerInfoCard } from './MarkerInfoCard';

interface CourierMarkerProps {
  courier: Courier;
}

/**
 * Courier pin on the map.
 *
 * - Color driven by status: idle (gray), delivering (green), rerouted (amber).
 * - Click opens an InfoWindow with courier details.
 */
export function CourierMarker({ courier }: CourierMarkerProps) {
  const [open, setOpen] = useState(false);

  const position = useMemo(() => {
    if (!courier.position) return { lat: 0, lng: 0 };
    return { lat: courier.position.lat, lng: courier.position.lng };
  }, [courier.position]);

  const icon = useMemo(() => {
    const colors: Record<Courier['status'], string> = {
      idle: '#9CA3AF',
      delivering: '#085427',
      rerouted: '#F59E0B',
    };
    const color = colors[courier.status] ?? colors.idle;

    // SVG data-URL pin with status color fill and white stroke
    const svg = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z"
          fill="${color}" stroke="white" stroke-width="2.5"/>
        <circle cx="18" cy="18" r="6" fill="white"/>
      </svg>`,
    );

    return {
      url: `data:image/svg+xml,${svg}`,
      scaledSize: { width: 36, height: 44 },
      anchor: { x: 18, y: 44 },
    } as google.maps.Icon;
  }, [courier.status]);

  const handleClick = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  if (!courier.position) return null;

  return (
    <Marker
      position={position}
      icon={icon}
      onClick={handleClick}
      title={`${courier.name} — ${courier.status}`}
    >
      {open && (
        <InfoWindow onCloseClick={handleClose}>
          <MarkerInfoCard courier={courier} />
        </InfoWindow>
      )}
    </Marker>
  );
}
