// filepath: src/services/firestore.service.ts
/**
 * Firestore Service - Database Operations
 * Handles CRUD operations for all collections
 */

import {
  Firestore,
  CollectionReference,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { getFirestoreDb, initializeFirebase } from '../config/index.js';
import {
  Order,
  Courier,
  Obstacle,
  AIDecisionLog,
  OrderStatus,
  CourierStatus,
  ObstacleStatus,
  AIDecisionType,
} from '../types/index.js';

// ============ FirestoreService Class ============

export class FirestoreService {
  private db: Firestore;

  constructor() {
    initializeFirebase();
    this.db = getFirestoreDb();
  }

  // ============ Orders ============

  async createOrder(order: Omit<Order, 'id'>): Promise<string> {
    const docRef = await this.db.collection('orders').add({
      ...order,
      createdAt: order.createdAt.toISOString(),
      completedAt: order.completedAt?.toISOString() || null,
    });
    return docRef.id;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const doc = await this.db.collection('orders').doc(orderId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Order;
  }

  async getPendingOrders(): Promise<Order[]> {
    const snapshot = await this.db
      .collection('orders')
      .where('status', '==', 'pending')
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order));
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, courierId?: string): Promise<void> {
    const updateData: any = { status };
    if (courierId) {
      updateData.assignedCourierId = courierId;
    }
    if (status === 'assigned') {
      updateData.driverStatus = 'assigned';
    }
    if (status === 'completed') {
      updateData.completedAt = new Date().toISOString();
    }
    await this.db.collection('orders').doc(orderId).update(updateData);
  }

  async updateOrderStatusWithData(orderId: string, updateData: any): Promise<void> {
    await this.db.collection('orders').doc(orderId).update(updateData);
  }

  async getOrdersByCourier(courierId: string): Promise<Order[]> {
    const snapshot = await this.db
      .collection('orders')
      .where('assignedCourierId', '==', courierId)
      .get();
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order));
    // Filter to active orders (not completed/failed) for driver
    return orders.filter((o) => o.status === 'assigned' || o.status === 'pending');
  }

  // ============ Couriers ============

  async createCourier(courier: Omit<Courier, 'id'>): Promise<string> {
    const docRef = await this.db.collection('couriers').add({
      ...courier,
      updatedAt: courier.updatedAt.toISOString(),
    });
    return docRef.id;
  }

  async getCourier(courierId: string): Promise<Courier | null> {
    const doc = await this.db.collection('couriers').doc(courierId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Courier;
  }

  async getAllCouriers(): Promise<Courier[]> {
    const snapshot = await this.db.collection('couriers').get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Courier));
  }

  async getIdleCouriers(): Promise<Courier[]> {
    const snapshot = await this.db
      .collection('couriers')
      .where('status', '==', 'idle')
      .get();
    const couriers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Courier));
    // Filter out stale couriers — no location update for >45 seconds
    // (3x LOCATION_BROADCAST_INTERVAL_MS default 15000ms)
    const now = Date.now();
    return couriers.filter((c) => {
      const updatedAt = c.updatedAt instanceof Date ? c.updatedAt.getTime() : Date.now();
      return (now - updatedAt) < 45000;
    });
  }

  async updateCourierLocation(
    courierId: string,
    location: { lat: number; lng: number },
    polyline?: string
  ): Promise<void> {
    const updateData: any = {
      currentLocation: location,
      updatedAt: new Date().toISOString(),
    };
    if (polyline) {
      updateData.currentRoutePolyline = polyline;
    }
    await this.db.collection('couriers').doc(courierId).update(updateData);
  }

  async assignOrderToCourier(courierId: string, orderId: string): Promise<void> {
    const courier = await this.getCourier(courierId);
    if (!courier) throw new Error('Courier not found');

    const assignedOrders = [...courier.assignedOrders, orderId];
    await this.db.collection('couriers').doc(courierId).update({
      assignedOrders,
      status: 'delivering',
      updatedAt: new Date().toISOString(),
    });
  }

  async removeOrderFromCourier(courierId: string, orderId: string): Promise<void> {
    const courier = await this.getCourier(courierId);
    if (!courier) throw new Error('Courier not found');

    const assignedOrders = courier.assignedOrders.filter((id) => id !== orderId);
    const updateData: any = {
      assignedOrders,
      updatedAt: new Date().toISOString(),
    };

    // If no more orders, mark courier as idle
    if (assignedOrders.length === 0) {
      updateData.status = 'idle';
    }

    await this.db.collection('couriers').doc(courierId).update(updateData);
  }

  // ============ Obstacles ============

  async createObstacle(obstacle: Omit<Obstacle, 'id'>): Promise<string> {
    const docRef = await this.db.collection('obstacles').add({
      ...obstacle,
      createdAt: obstacle.createdAt.toISOString(),
    });
    return docRef.id;
  }

  async getObstacle(obstacleId: string): Promise<Obstacle | null> {
    const doc = await this.db.collection('obstacles').doc(obstacleId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Obstacle;
  }

  async updateObstacleAnalysis(
    obstacleId: string,
    analysis: { severity: string; description: string; actionTaken: string }
  ): Promise<void> {
    await this.db.collection('obstacles').doc(obstacleId).update({
      aiAnalysis: analysis,
      status: 'analyzed',
    });
  }

  // ============ AI Decision Logs ============

  async createAIDecisionLog(log: Omit<AIDecisionLog, 'id'>): Promise<string> {
    const docRef = await this.db.collection('ai_decision_logs').add({
      ...log,
      timestamp: log.timestamp.toISOString(),
    });
    return docRef.id;
  }

  async getRecentDecisionLogs(limit: number = 10): Promise<AIDecisionLog[]> {
    const snapshot = await this.db
      .collection('ai_decision_logs')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AIDecisionLog));
  }

  // ============ Listeners ============

  onPendingOrdersChange(callback: (orders: Order[]) => void): () => void {
    const unsubscribe = this.db
      .collection('orders')
      .where('status', '==', 'pending')
      .onSnapshot((snapshot) => {
        const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order));
        callback(orders);
      });
    return unsubscribe;
  }

  onCourierLocationChange(
    courierId: string,
    callback: (location: { lat: number; lng: number }) => void
  ): () => void {
    const unsubscribe = this.db
      .collection('couriers')
      .doc(courierId)
      .onSnapshot((snapshot) => {
        if (snapshot.exists) {
          const data = snapshot.data();
          callback(data?.currentLocation);
        }
      });
    return unsubscribe;
  }
}

// Export singleton instance
export const firestoreService = new FirestoreService();