import { useMemo } from 'react';
import { Marker } from '@react-google-maps/api';
import type { Order } from '@/types/domain';

interface OrderMarkerProps {
  order: Order;
}

/**
 * Order endpoint markers: pickup (green) and dropoff (red).
 *
 * Two markers per order, labeled with small pill icons.
 */
export function OrderMarker({ order }: OrderMarkerProps) {
  const pickupIcon = useMemo(
    () =>
      ({
        url: `data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="12" fill="#8CE363" stroke="white" stroke-width="2.5"/>
            <text x="14" y="18" text-anchor="middle" font-size="12" font-weight="700" fill="#085427">P</text>
          </svg>`,
        )}`,
        scaledSize: { width: 28, height: 28 },
        anchor: { x: 14, y: 14 },
      } as google.maps.Icon),
    [],
  );

  const dropoffIcon = useMemo(
    () =>
      ({
        url: `data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="12" fill="#EF4444" stroke="white" stroke-width="2.5"/>
            <text x="14" y="18" text-anchor="middle" font-size="12" font-weight="700" fill="white">D</text>
          </svg>`,
        )}`,
        scaledSize: { width: 28, height: 28 },
        anchor: { x: 14, y: 14 },
      } as google.maps.Icon),
    [],
  );

  return (
    <>
      <Marker
        position={{ lat: order.pickup.lat, lng: order.pickup.lng }}
        icon={pickupIcon}
        title="Pickup"
      />
      <Marker
        position={{ lat: order.dropoff.lat, lng: order.dropoff.lng }}
        icon={dropoffIcon}
        title="Dropoff"
      />
    </>
  );
}
