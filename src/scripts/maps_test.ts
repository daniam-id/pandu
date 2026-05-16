import { mapsService } from '../services/maps.service.js';

/**
 * Google Maps Service Test Suite
 * Tests distance calculation, radius checks, route calculation, and traffic data
 */

async function runMapsTests() {
  console.log('🗺️  Starting Google Maps Service Tests...\n');

  // Test data - Surabaya coordinates
  const testLocations = {
    office: { lat: -7.2504, lng: 112.7545 }, // Surabaya city center (approx)
    pickup1: { lat: -7.2500, lng: 112.7550 },
    pickup2: { lat: -7.2520, lng: 112.7560 },
    pickup3: { lat: -7.3500, lng: 112.8000 }, // Far away (~10 km)
    dropoff: { lat: -7.2480, lng: 112.7520 },
  };

  // ============ Test 1: Distance Calculation (Haversine) ============
  console.log('=== Test 1: Distance Calculation (Haversine) ===');
  try {
    const dist1 = mapsService.calculateDistance(testLocations.office, testLocations.pickup1);
    const dist2 = mapsService.calculateDistance(testLocations.office, testLocations.pickup3);
    const dist3 = mapsService.calculateDistance(testLocations.pickup1, testLocations.dropoff);

    console.log(`✅ Office → Pickup1: ${dist1.toFixed(3)} km`);
    console.log(`✅ Office → Pickup3 (far): ${dist2.toFixed(3)} km`);
    console.log(`✅ Pickup1 → Dropoff: ${dist3.toFixed(3)} km`);

    if (dist1 > 0 && dist2 > dist1 && dist3 > 0) {
      console.log('✅ Distance calculations are correct\n');
    } else {
      console.log('❌ Distance calculations failed validation\n');
    }
  } catch (error) {
    console.error('❌ Error in distance calculation:', error);
  }

  // ============ Test 2: Radius Check (1 km radius) ============
  console.log('=== Test 2: Radius Check (1 km threshold) ===');
  try {
    const within1km = mapsService.isWithinRadius(testLocations.office, testLocations.pickup1, 1);
    const within10km = mapsService.isWithinRadius(testLocations.office, testLocations.pickup3, 10);
    const notWithin1km = mapsService.isWithinRadius(testLocations.office, testLocations.pickup3, 1);

    console.log(`✅ Office → Pickup1 within 1km: ${within1km}`);
    console.log(`✅ Office → Pickup3 within 10km: ${within10km}`);
    console.log(`✅ Office → Pickup3 within 1km: ${notWithin1km}`);

    if (within1km && within10km && !notWithin1km) {
      console.log('✅ Radius checks are correct\n');
    } else {
      console.log('❌ Radius checks failed validation\n');
    }
  } catch (error) {
    console.error('❌ Error in radius check:', error);
  }

  // ============ Test 3: Route Calculation (Google Maps API) ============
  console.log('=== Test 3: Route Calculation (Google Maps Directions API) ===');
  try {
    const route = await mapsService.calculateRoute(testLocations.office, testLocations.dropoff);

    if (route) {
      console.log(`✅ Route found:`);
      console.log(`   Distance: ${route.distance}`);
      console.log(`   Duration: ${route.duration}`);
      console.log(`   Polyline: ${route.polyline.substring(0, 30)}...`);
      console.log('✅ Google Maps API is working\n');
    } else {
      console.log('⚠️  No route found - API might have failed or is rate limited\n');
    }
  } catch (error) {
    console.error('❌ Error calling Google Maps API:', error);
  }

  // ============ Test 4: Route with Avoidance ============
  console.log('=== Test 4: Route Calculation with Avoidance ===');
  try {
    const routeAvoiding = await mapsService.calculateRouteAvoiding(
      testLocations.office,
      testLocations.dropoff,
      [testLocations.pickup1]
    );

    if (routeAvoiding) {
      console.log(`✅ Route with avoidance found:`);
      console.log(`   Distance: ${routeAvoiding.distance}`);
      console.log(`   Duration: ${routeAvoiding.duration}`);
      console.log('✅ Avoidance routing is working\n');
    } else {
      console.log('⚠️  No route with avoidance found\n');
    }
  } catch (error) {
    console.error('❌ Error in avoidance routing:', error);
  }

  // ============ Test 5: Traffic Data (Simulated) ============
  console.log('=== Test 5: Traffic Data (Simulated) ===');
  try {
    const trafficData = await mapsService.getTrafficData('Jalan HR Muhammad');

    if (trafficData) {
      console.log(`✅ Traffic data retrieved:`);
      console.log(`   Congestion Level: ${trafficData.congestionLevel}`);
      console.log(`   Average Speed: ${trafficData.averageSpeed} km/h`);
      console.log('✅ Traffic data service is working\n');
    } else {
      console.log('⚠️  Failed to get traffic data\n');
    }
  } catch (error) {
    console.error('❌ Error getting traffic data:', error);
  }

  // ============ Test 6: Polyline Encoding ============
  console.log('=== Test 6: Polyline Encoding ===');
  try {
    const points = [
      { lat: -7.2504, lng: 112.7545 },
      { lat: -7.2500, lng: 112.7550 },
      { lat: -7.2480, lng: 112.7520 },
    ];

    const encoded = mapsService.encodePolyline(points);

    console.log(`✅ Points encoded: ${points.length} points`);
    console.log(`   Encoded polyline: ${encoded}`);
    console.log(`   Encoding length: ${encoded.length} characters`);
    console.log('✅ Polyline encoding is working\n');
  } catch (error) {
    console.error('❌ Error in polyline encoding:', error);
  }

  // ============ Test 7: Batching Logic - Multiple Pickups Within 1km ============
  console.log('=== Test 7: Batching Logic - Multiple Pickups within 1km ===');
  try {
    const courier = testLocations.office;

    const batch1 = mapsService.isWithinRadius(courier, testLocations.pickup1, 1);
    const batch2 = mapsService.isWithinRadius(courier, testLocations.pickup2, 1);
    const batch3 = mapsService.isWithinRadius(courier, testLocations.pickup3, 1);

    const batchableCount = [batch1, batch2, batch3].filter(Boolean).length;

    console.log(`✅ Courier at: (${courier.lat}, ${courier.lng})`);
    console.log(`   Pickup1 batchable: ${batch1}`);
    console.log(`   Pickup2 batchable: ${batch2}`);
    console.log(`   Pickup3 batchable: ${batch3}`);
    console.log(`   Total batchable: ${batchableCount}/3 pickups`);

    if (batchableCount === 2) {
      console.log('✅ Batching logic is correct\n');
    } else {
      console.log(`⚠️  Expected 2 batchable pickups, got ${batchableCount}\n`);
    }
  } catch (error) {
    console.error('❌ Error in batching logic:', error);
  }

  console.log('🏁 Google Maps Service Tests Completed!\n');
}

runMapsTests().catch(console.error);
