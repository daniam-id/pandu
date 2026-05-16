import { config } from '../config/index.js';

const API_BASE = 'http://127.0.0.1:8081/api/v1';
const API_KEY = config.apiKey || 'pandu-demo-key-123';
const HEADERS = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

interface ApiResponse {
  status: string;
  message?: string;
  data?: {
    assignedCourierId?: string;
    affectedCouriers?: unknown[];
    severity?: string;
    actionTaken?: string;
  };
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('Starting E2E Tests for Pandu.ai Backend...\n');

  let testActiveCourierId: string | undefined;

  // --- Scenario 1: Initialization & Normal Distribution ---
  console.log('=== Scenario 1: Dispatching 5 Normal Orders ===');
  for (let i = 0; i < 5; i++) {
    const payload = {
      pickupLocation: { lat: -7.25 + (Math.random() * 0.01), lng: 112.76 + (Math.random() * 0.01) },
      dropoffLocation: { lat: -7.26 + (Math.random() * 0.01), lng: 112.75 + (Math.random() * 0.01) },
      priority: 'normal'
    };
    
    try {
      const res = await fetch(`${API_BASE}/orders/dispatch`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(payload)
      });
      const data = (await res.json()) as ApiResponse;
      console.log(`Order ${i + 1} response:`, data.status === 'success' ? 'SUCCESS' : `FAILED (${data.message})`);
      if (data.data?.assignedCourierId && !testActiveCourierId) {
        testActiveCourierId = data.data.assignedCourierId; // Save an active courier ID for later
      }
    } catch (e) {
      console.error(`Order ${i + 1} request failed:`, e);
    }
    await sleep(500); // Slight delay between orders
  }
  console.log('Scenario 1 Complete.\n');

  // --- Scenario 2: Dynamic Response to Traffic ---
  console.log('=== Scenario 2: Simulate Traffic Anomaly ===');
  const trafficPayload = {
    targetAreaName: 'Jalan HR Muhammad',
    congestionLevel: 'heavy',
    affectedRadiusKm: 2.5
  };
  try {
    const res = await fetch(`${API_BASE}/simulation/traffic`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(trafficPayload)
    });
    const data = (await res.json()) as ApiResponse;
    console.log(`Traffic simulation response:`, data.status === 'success' ? `SUCCESS (${data.data?.affectedCouriers?.length} couriers affected)` : `FAILED (${data.message})`);
  } catch (e) {
    console.error(`Traffic simulation request failed:`, e);
  }
  console.log('Scenario 2 Complete.\n');

  // --- Scenario 3: Multi-Order Batching ---
  console.log('=== Scenario 3: Batching Nearby Orders ===');
  // Send 3 orders to the exact same pickup location
  const batchPickup = { lat: -7.251, lng: 112.761 };
  for (let i = 0; i < 3; i++) {
    const payload = {
      pickupLocation: batchPickup,
      dropoffLocation: { lat: -7.26 + (Math.random() * 0.01), lng: 112.75 + (Math.random() * 0.01) },
      priority: 'high'
    };
    try {
      const res = await fetch(`${API_BASE}/orders/dispatch`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(payload)
      });
      const data = (await res.json()) as ApiResponse;
      console.log(`Batch Order ${i + 1} response:`, data.status === 'success' ? `SUCCESS (Assigned: ${data.data?.assignedCourierId})` : `FAILED (${data.message})`);
    } catch (e) {
      console.error(`Batch Order ${i + 1} request failed:`, e);
    }
    await sleep(2000); // Give AI time to batch
  }
  console.log('Scenario 3 Complete.\n');

  // --- Scenario 4: Multimodal Intervention (Obstacle) ---
  console.log('=== Scenario 4: Obstacle Reporting via Vision ===');
  if (!testActiveCourierId) {
    console.log('Skipping Scenario 4: No active courier ID found from earlier steps.');
  } else {
    const obstaclePayload = {
      courierId: testActiveCourierId,
      imageUrl: 'https://storage.googleapis.com/pandu-assets/demo/flood.jpg', // Dummy URL for demo
      location: { lat: -7.255, lng: 112.765 },
      timestamp: new Date().toISOString()
    };
    try {
      const res = await fetch(`${API_BASE}/obstacles/report`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(obstaclePayload)
      });
      const data = (await res.json()) as ApiResponse;
      console.log(`Obstacle report response:`, data.status === 'success' ? `SUCCESS (Severity: ${data.data?.severity}, Action: ${data.data?.actionTaken})` : `FAILED (${data.message})`);
    } catch (e) {
      console.error(`Obstacle report request failed:`, e);
    }
  }
  console.log('Scenario 4 Complete.\n');

  console.log('E2E Tests Finished.');
}

runTests().catch(console.error);
