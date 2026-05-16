import { logger } from '../utils/logger.js';
// filepath: src/services/maps.service.ts
/**
 * Maps Service - Google Maps Routes API Integration
 * Handles route calculation, distance matrix, and traffic data
 */

import { config } from '../config/index.js';
import { GeoLocation, RouteInfo, CongestionLevel } from '../types/index.js';

// ============ Google Maps API Endpoints ============

const ROUTES_API_BASE = 'https://routes.googleapis.com/v1';
const DIRECTIONS_API_BASE = 'https://maps.googleapis.com/maps/api/directions/json';

// ============ MapsService Class ============

export class MapsService {
  private apiKey: string;

  constructor() {
    this.apiKey = config.maps.apiKey;
  }

  /**
   * Calculate route between two locations
   */
  async calculateRoute(
    origin: GeoLocation,
    destination: GeoLocation,
    options?: {
      avoid?: string[];
      trafficModel?: 'best_guess' | 'pessimistic' | 'optimistic';
    }
  ): Promise<RouteInfo | null> {
    try {
      const originStr = `${origin.lat},${origin.lng}`;
      const destinationStr = `${destination.lat},${destination.lng}`;

      const params = new URLSearchParams({
        origin: originStr,
        destination: destinationStr,
        key: this.apiKey,
        mode: 'driving',
      });

      if (options?.avoid) {
        params.append('avoid', options.avoid.join('|'));
      }

      const response = await fetch(`${DIRECTIONS_API_BASE}?${params}`);
      const data = (await response.json()) as any;

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];

        return {
          distance: leg.distance.text,
          duration: leg.duration.text,
          polyline: route.overview_polyline.points,
        };
      }

      return null;
    } catch (error) {
      logger.error(error);
      return null;
    }
  }

  /**
   * Calculate route avoiding specific locations
   */
  async calculateRouteAvoiding(
    origin: GeoLocation,
    destination: GeoLocation,
    avoidLocations: GeoLocation[]
  ): Promise<RouteInfo | null> {
    // For now, use simple avoid parameter
    // In production, would use Google Maps Routes API for advanced avoidance
    return this.calculateRoute(origin, destination, {
      avoid: ['highways'], // Simplified for demo
    });
  }

  /**
   * Get distance between two points (simple calculation)
   */
  calculateDistance(origin: GeoLocation, destination: GeoLocation): number {
    // Haversine formula for distance in km
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(destination.lat - origin.lat);
    const dLon = this.toRad(destination.lng - origin.lng);
    const lat1 = this.toRad(origin.lat);
    const lat2 = this.toRad(destination.lat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Check if two locations are within a given radius
   */
  isWithinRadius(origin: GeoLocation, destination: GeoLocation, radiusKm: number): boolean {
    const distance = this.calculateDistance(origin, destination);
    return distance <= radiusKm;
  }

  /**
   * Get traffic data for an area (simulated for demo)
   * In production, would use Google Maps Roads API or Traffic API
   */
  async getTrafficData(areaName: string): Promise<{
    congestionLevel: CongestionLevel;
    averageSpeed: number;
  } | null> {
    // For demo purposes, return simulated data
    // In production, integrate with real traffic API
    logger.info(`Getting traffic data for: ${areaName}`);
    return {
      congestionLevel: 'moderate',
      averageSpeed: 30, // km/h
    };
  }

  /**
   * Encode polyline (simplified version)
   * In production, use @google/maps-polyline algorithm
   */
  encodePolyline(points: { lat: number; lng: number }[]): string {
    // Simplified polyline encoding
    let result = '';
    let prevLat = 0;
    let prevLng = 0;

    for (const point of points) {
      const lat = Math.round(point.lat * 1e5);
      const lng = Math.round(point.lng * 1e5);

      result += this.encodeValue(lat - prevLat) + this.encodeValue(lng - prevLng);
      prevLat = lat;
      prevLng = lng;
    }

    return result;
  }

  // Helper: Convert degrees to radians
  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Helper: Encode a single value
  private encodeValue(value: number): string {
    let v = value < 0 ? ~(value << 1) : value << 1;
    let result = '';

    while (v >= 0x20) {
      result += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }

    result += String.fromCharCode(v + 63);
    return result;
  }
}

// Export singleton instance
export const mapsService = new MapsService();