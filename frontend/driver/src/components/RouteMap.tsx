// Tujuan    : Google Maps component showing current position, pickup, dropoff markers and polyline
// Caller    : RoutePage
// Dependensi: @googlemaps/js-api-loader, types/domain (Order), react (useEffect, useRef, useState)
// Main Func : Renders interactive Google Map with markers and route polyline
// Side Effects: Loads Google Maps JS API, creates map DOM node, calls fetchRoute on mount

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { fetchRoute } from '@/services/api';
import type { Order } from '@/types/domain';
import { MapPin } from 'lucide-react';

interface RouteMapProps {
  order: Order;
}

export default function RouteMap({ order }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const apiKey = import.meta.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'demo') {
      setLoadError(true);
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
    });

    let map: google.maps.Map | undefined;
    const markers: google.maps.Marker[] = [];
    let polyline: google.maps.Polyline | undefined;

    loader
      .importLibrary('maps')
      .then(async ({ Map }) => {
        if (!mapRef.current) return;

        map = new Map(mapRef.current, {
          center: { lat: order.pickup.lat, lng: order.pickup.lng },
          zoom: 14,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });

        const { Marker } = await loader.importLibrary('marker');

        // Pickup marker
        const pickupMarker = new Marker({
          position: { lat: order.pickup.lat, lng: order.pickup.lng },
          map,
          title: 'Pickup',
        });
        markers.push(pickupMarker);

        // Dropoff marker
        const dropoffMarker = new Marker({
          position: { lat: order.dropoff.lat, lng: order.dropoff.lng },
          map,
          title: 'Dropoff',
        });
        markers.push(dropoffMarker);

        // Fit bounds
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: order.pickup.lat, lng: order.pickup.lng });
        bounds.extend({ lat: order.dropoff.lat, lng: order.dropoff.lng });
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });

        // Fetch and draw route polyline
        try {
          const routeData = await fetchRoute(order.id);
          if (routeData.polyline && routeData.polyline.length > 0) {
            const path = routeData.polyline.map((p: { lat: number; lng: number }) => ({ lat: p.lat, lng: p.lng }));
            polyline = new google.maps.Polyline({
              path,
              geodesic: true,
              strokeColor: '#085427',
              strokeOpacity: 1.0,
              strokeWeight: 4,
            });
            polyline.setMap(map);
          }
        } catch {
          // Silently skip route polyline if backend route unavailable
        }

        setMapLoaded(true);
      })
      .catch(() => {
        setLoadError(true);
      });

    return () => {
      markers.forEach((m) => m.setMap(null));
      polyline?.setMap(null);
      map = undefined;
    };
  }, [order]);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface text-center px-6">
        <MapPin size={40} className="text-text-faint mb-2" />
        <p className="text-sm text-text-muted">Peta tidak tersedia</p>
        <p className="text-xs text-text-faint mt-1">
          {order.pickup.address} → {order.dropoff.address}
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
