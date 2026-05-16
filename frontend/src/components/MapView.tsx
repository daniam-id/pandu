import { useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import type { Courier, Order } from '@/types/domain';
import { panduMapStyle } from '@/utils/mapStyle';
import { MapSkeleton } from './MapSkeleton';
import { MapError } from './MapError';
import { CourierMarker } from './CourierMarker';
import { OrderMarker } from './OrderMarker';
import { RoutePolyline } from './RoutePolyline';

interface MapViewProps {
  couriers: Courier[];
  orders: Order[];
  loading?: boolean;
}

/**
 * Default center — Surabaya, Indonesia (GDG Surabaya hackathon context).
 */
const DEFAULT_CENTER = { lat: -7.2575, lng: 112.7521 };

const MAP_CONTAINER_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  minHeight: '400px',
  borderRadius: '20px',
};

/**
 * Live map panel.
 *
 * - Loads Google Maps JS API via `useJsApiLoader`.
 * - Applies custom Pandu brand style (high-contrast roads, cyan water, green parks).
 * - Renders courier pins (status-colored), order pickup/dropoff pins, and route polylines.
 * - Shows skeleton while loading; shows error fallback on load failure.
 */
export function MapView({ couriers, orders, loading }: MapViewProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['geometry'],
  });

  const onLoad = useCallback((_map: google.maps.Map) => {
    // Reserved for future programmatic pan/zoom control
  }, []);

  const onUnmount = useCallback(() => {
    // Cleanup reserved
  }, []);

  const center = useMemo(() => {
    // If there are active couriers with positions, center on the first one.
    const active = couriers.find((c) => c.position);
    if (active?.position) {
      return { lat: active.position.lat, lng: active.position.lng };
    }
    return DEFAULT_CENTER;
  }, [couriers]);

  if (loading) {
    return <MapSkeleton />;
  }

  if (loadError) {
    return (
      <MapError
        message={loadError.message}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!isLoaded) {
    return <MapSkeleton />;
  }

  const mapOptions: google.maps.MapOptions = {
    styles: panduMapStyle,
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_BOTTOM,
    },
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    gestureHandling: 'greedy',
    minZoom: 4,
    maxZoom: 20,
  };

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {/* Courier markers + routes */}
        {couriers.map((courier) => (
          <CourierMarker key={courier.id} courier={courier} />
        ))}
        {couriers.map((courier) => (
          <RoutePolyline key={`route-${courier.id}`} courier={courier} />
        ))}

        {/* Order markers */}
        {orders.map((order) => (
          <OrderMarker key={order.id} order={order} />
        ))}
      </GoogleMap>
    </div>
  );
}
