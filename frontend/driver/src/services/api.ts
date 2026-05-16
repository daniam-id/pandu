// Tujuan    : Axios HTTP client with x-api-key auth, response envelope unwrap, error handling, offline retry queue
// Caller    : OrderActions, ReportObstaclePage, useLiveLocation, RoutePage, RouteMap, TurnByTurn
// Dependensi: axios, sonner (toast), env (REACT_APP_API_BASE_URL, REACT_APP_API_KEY), domain types
// Main Func : apiClient instance + fetchOrders, updateOrderStatus, reportObstacle, updateLocation, fetchRoute
// Side Effects: HTTP POST/GET, Sonner toast on errors, navigator.onLine listener for retry queue

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import type { OrderStatus } from '@/types/domain';

const API_BASE = import.meta.env.REACT_APP_API_BASE_URL;
const API_KEY = import.meta.env.REACT_APP_API_KEY;

/** Indonesian fallback messages by HTTP status code (only used when backend doesn't supply error.message). */
function fallbackMessage(status?: number): string {
  switch (status) {
    case 401:
      return 'API key tidak valid atau hilang.';
    case 403:
      return 'Akses ditolak.';
    case 404:
      return 'Data tidak ditemukan.';
    case 429:
      return 'Terlalu banyak permintaan. Coba lagi dalam 60 detik.';
    case 500:
    case 502:
    case 503:
      return 'Server bermasalah. Coba lagi sebentar lagi.';
    default:
      return 'Terjadi kesalahan. Coba lagi.';
  }
}

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

/* ---------- Request interceptor: attach x-api-key (skip /health) ---------- */
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const url = config.url ?? '';
  const isHealth = url.includes('/health');
  if (!isHealth && API_KEY) {
    config.headers.set('x-api-key', API_KEY);
  }
  return config;
});

/* ---------- Offline retry queue for status updates ---------- */
interface QueuedUpdate {
  orderId: string;
  status: OrderStatus;
  failureReason?: string;
  attempts: number;
}

let offlineQueue: QueuedUpdate[] = [];

function processQueue() {
  if (!navigator.onLine || offlineQueue.length === 0) return;

  const remaining: QueuedUpdate[] = [];

  offlineQueue.forEach((item) => {
    if (item.attempts >= 3) {
      toast.error('Gagal memperbarui status. Mohon coba lagi.', {
        action: {
          label: 'Coba lagi',
          onClick: () => {
            item.attempts = 0;
            offlineQueue.push(item);
            processQueue();
          },
        },
      });
      return;
    }

    updateOrderStatus(item.orderId, item.status, item.failureReason)
      .then(() => {
        toast.success('Status berhasil diperbarui');
      })
      .catch(() => {
        item.attempts++;
        remaining.push(item);
      });
  });

  offlineQueue = remaining;
}

window.addEventListener('online', processQueue);

/* ---------- Response interceptor: unwrap envelope + Indonesian errors ---------- */
apiClient.interceptors.response.use(
  (res) => {
    // Unwrap `{success: true, data: X}` envelope so callers see X directly via `res.data`.
    // Health endpoint and other non-envelope responses pass through untouched.
    const body = res.data;
    if (
      body &&
      typeof body === 'object' &&
      (body as { success?: unknown }).success === true &&
      'data' in body
    ) {
      res.data = (body as { data: unknown }).data;
    }
    return res;
  },
  (err: AxiosError<{ error?: { code?: string; message?: string } }>) => {
    const status = err.response?.status;
    const backendError = err.response?.data?.error;
    const msg = backendError?.message ?? fallbackMessage(status);

    if (!navigator.onLine) {
      toast.warning('Koneksi terputus. Menunggu jaringan...');
    } else {
      toast.error(msg);
    }
    return Promise.reject(err);
  },
);

/* ---------- API functions ---------- */

export async function fetchOrders(courierId: string) {
  const { data } = await apiClient.get('/orders', { params: { courierId } });
  // Backend may return either an array directly or `{ orders: [...] }`.
  if (Array.isArray(data)) return data;
  return data?.orders ?? [];
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  failureReason?: string,
) {
  if (!navigator.onLine) {
    offlineQueue.push({ orderId, status, failureReason, attempts: 0 });
    toast.info('Status akan diperbarui saat koneksi kembali');
    return Promise.resolve({ queued: true });
  }

  const payload: Record<string, unknown> = { status, timestamp: new Date().toISOString() };
  if (failureReason) payload.failureReason = failureReason;

  const { data } = await apiClient.post(`/orders/${orderId}/status`, payload);
  return data;
}

export async function reportObstacle(formData: FormData) {
  const { data } = await apiClient.post('/obstacles/report', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateLocation(courierId: string, lat: number, lng: number) {
  const { data } = await apiClient.post('/driver/location', {
    courierId,
    lat,
    lng,
    timestamp: new Date().toISOString(),
  });
  return data;
}

export async function fetchRoute(orderId: string) {
  const { data } = await apiClient.get(`/routes/${orderId}`);
  return data;
}

export default apiClient;
