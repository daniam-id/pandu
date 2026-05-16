// Tujuan    : Watch GPS position and broadcast to backend at 15-second intervals
// Caller    : LiveLocationToggle, ProfilePage
// Dependensi: navigator.geolocation, api.ts (updateLocation), react (useEffect, useState, useRef)
// Main Func : Returns { isActive, lastUpdate, error, start, stop }
// Side Effects: Calls navigator.geolocation.watchPosition, POSTs to /driver/location, cleanup on unmount

import { useEffect, useRef, useState, useCallback } from 'react';
import { updateLocation } from '@/services/api';

const COURIER_ID = import.meta.env.REACT_APP_COURIER_ID;
const INTERVAL_MS = 15000;

interface LiveLocationState {
  isActive: boolean;
  lastUpdate: Date | null;
  error: string | null;
}

export function useLiveLocation() {
  const [state, setState] = useState<LiveLocationState>({
    isActive: false,
    lastUpdate: null,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const positionRef = useRef<GeolocationPosition | null>(null);

  const broadcast = useCallback(() => {
    if (!positionRef.current) return;

    const { latitude: lat, longitude: lng } = positionRef.current.coords;

    updateLocation(COURIER_ID, lat, lng).catch(() => {
      // Silently drop failed location updates; next tick retries
    });

    setState((prev) => ({ ...prev, lastUpdate: new Date() }));
  }, []);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    positionRef.current = null;
    setState({ isActive: false, lastUpdate: null, error: null });
  }, []);

  const start = useCallback(() => {
    if (watchIdRef.current !== null) return;

    setState((prev) => ({ ...prev, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        positionRef.current = pos;
        setState((prev) => {
          if (!prev.isActive) {
            broadcast();
            return { ...prev, isActive: true };
          }
          return prev;
        });
      },
      (err) => {
        let msg = 'Gagal mengakses lokasi.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Izin lokasi ditolak. Aktifkan di Pengaturan perangkat.';
        }
        setState({ isActive: false, lastUpdate: null, error: msg });
        stop();
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 },
    );

    intervalRef.current = setInterval(broadcast, INTERVAL_MS);
  }, [broadcast, stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { ...state, start, stop };
}
