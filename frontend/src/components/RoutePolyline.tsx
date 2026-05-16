import { Polyline } from '@react-google-maps/api';
import type { Courier } from '@/types/domain';
import { decodePolyline } from '@/utils/polyline';

interface RoutePolylineProps {
  courier: Courier;
}

/**
 * Renders a courier's assigned route as a polyline.
 *
 * - Solid brand-primary stroke for normal routes.
 * - Dashed amber stroke when the courier is rerouted.
 */
export function RoutePolyline({ courier }: RoutePolylineProps) {
  if (!courier.routePolyline || !courier.position) return null;

  const path = decodePolyline(courier.routePolyline);
  if (path.length === 0) return null;

  // Prepend current position so the line starts from the courier's real location
  const fullPath = [{ lat: courier.position.lat, lng: courier.position.lng }, ...path];

  const isRerouted = courier.status === 'rerouted';

  const options: google.maps.PolylineOptions = {
    path: fullPath,
    strokeColor: isRerouted ? '#F59E0B' : '#085427',
    strokeOpacity: isRerouted ? 0.9 : 0.85,
    strokeWeight: isRerouted ? 4 : 3,
    geodesic: true,
  };

  return <Polyline path={fullPath} options={options} />;
}
