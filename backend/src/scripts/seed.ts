import { firestoreService } from '../services/firestore.service.js';
import { Courier } from '../types/index.js';
import { config } from '../config/index.js';

async function seedCouriers() {
  console.log('Seeding 5 mock couriers...');
  
  // Starting coordinates somewhere in Surabaya
  const baseLat = -7.250445;
  const baseLng = 112.768845;

  const mockCouriers: Omit<Courier, 'id'>[] = [];

  for (let i = 1; i <= 5; i++) {
    mockCouriers.push({
      name: `Courier 00${i}`,
      phone: `+62812000000${i}`,
      status: 'idle',
      currentLocation: {
        lat: baseLat + (Math.random() * 0.02 - 0.01),
        lng: baseLng + (Math.random() * 0.02 - 0.01),
      },
      assignedOrders: [],
      currentRoutePolyline: '',
      updatedAt: new Date(),
    });
  }

  const existingCouriers = await firestoreService.getAllCouriers();
  
  if (existingCouriers.length >= 5) {
      console.log('Couriers already exist. Skipping seed.');
      return;
  }

  for (const courier of mockCouriers) {
    const id = await firestoreService.createCourier(courier);
    console.log(`Created courier: ${courier.name} with ID: ${id}`);
  }

  console.log('Seeding complete.');
  process.exit(0);
}

seedCouriers().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
