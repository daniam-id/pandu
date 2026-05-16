// Tujuan    : Axios HTTP client + endpoint wrappers untuk Admin Dashboard
// Caller    : OrderForm, CourierSimulator, SimulatorPage, TrafficSimButton, AIEngineStatus
// Dependensi: axios, services env (REACT_APP_API_BASE_URL, REACT_APP_API_KEY)
// Main Func : dispatchOrder, reportObstacle, simulateTraffic, checkHealth, cancelOrder, fetchOrderDetail
// Side Effects: HTTP requests ke backend, attach x-api-key header, unwrap {success,data} envelope

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { DispatchOrderPayload } from '@/types/domain';

const API_BASE = import.meta.env.REACT_APP_API_BASE_URL;
const API_KEY = import.meta.env.REACT_APP_API_KEY;

/** Shape of error body returned by the backend. Indonesian message ready for UI. */
export interface ApiError {
  code?: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Indonesian fallback messages by HTTP status code.
 * Used only when the backend doesn't return a usable error.message.
 */
function fallbackMessage(status?: number): string {
  switch (status) {
    case 401:
      return 'API key tidak valid atau hilang. Periksa konfigurasi.';
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
      return 'Terjadi kesalahan. Silakan coba lagi.';
  }
}

/**
 * Shared axios instance for all backend REST calls.
 * Timeout 8s to fail fast during hackathon demos.
 */
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor: attach x-api-key header to every /api/v1/* request.
 * Skips the /health endpoint per backend contract ("Health endpoint requires no auth").
 */
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const url = config.url ?? '';
  const isHealth = url.includes('/health');
  if (!isHealth && API_KEY) {
    config.headers.set('x-api-key', API_KEY);
  }
  return config;
});

/**
 * Response interceptor:
 *  - Success path: unwrap `{success: true, data: X}` → return X via `res.data`.
 *    Health endpoint and non-envelope responses pass through untouched.
 *  - Error path: normalise to `Error` with backend `message` (Indonesian),
 *    while preserving `code`, `status`, and original axios error on the thrown object.
 */
apiClient.interceptors.response.use(
  (res) => {
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
  (err: AxiosError<{ error?: ApiError }>) => {
    const status = err.response?.status;
    const backendError = err.response?.data?.error;
    const message = backendError?.message ?? fallbackMessage(status);

    const wrapped = new Error(message) as Error & {
      status?: number;
      code?: string;
      details?: Record<string, unknown>;
      cause?: unknown;
    };
    wrapped.status = status;
    wrapped.code = backendError?.code;
    wrapped.details = backendError?.details;
    wrapped.cause = err;
    return Promise.reject(wrapped);
  },
);

/* ---------- Endpoint wrappers ---------- */

/**
 * Dispatch a new order to the backend (AI courier assignment).
 * Backend writes to Firestore → onSnapshot updates the UI.
 *
 * Returns: `{ orderId, assignedCourierId, estimatedDeliveryTime }`
 */
export async function dispatchOrder(payload: DispatchOrderPayload) {
  const { data } = await apiClient.post('/orders/dispatch', payload);
  return data;
}

/**
 * Cancel a pending or in-flight order. Backend marks it `cancelled` and frees the courier.
 */
export async function cancelOrder(orderId: string, reason?: string) {
  const { data } = await apiClient.post(`/orders/${orderId}/cancel`, reason ? { reason } : {});
  return data;
}

/**
 * Fetch a single order by id (admin detail view, optional usage).
 */
export async function fetchOrderDetail(orderId: string) {
  const { data } = await apiClient.get(`/orders/${orderId}`);
  return data;
}

/**
 * Report an obstacle (with optional photo) from the courier simulator.
 * Accepts a pre-built FormData so the caller can attach the image blob.
 */
export async function reportObstacle(formData: FormData) {
  const { data } = await apiClient.post('/obstacles/report', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/**
 * Trigger a traffic simulation anomaly on the backend (demo scenarios 2 & 3).
 */
export async function simulateTraffic(payload?: Record<string, unknown>) {
  const { data } = await apiClient.post('/simulation/traffic', payload ?? {});
  return data;
}

/** Per-service health status as returned by the backend `/health` endpoint. */
export type ServiceState = 'ok' | 'failing' | 'degraded' | 'unknown';

/**
 * Aggregate health snapshot for the UI badge.
 *  - `ok`        : all known services are healthy and the request returned 2xx
 *  - `degraded`  : the request succeeded but at least one service is failing,
 *                  OR the request returned non-2xx but a body could be parsed
 *  - `down`      : network error / timeout / no response body
 */
export interface HealthSnapshot {
  state: 'ok' | 'degraded' | 'down';
  services: Record<string, ServiceState>;
  raw?: unknown;
}

/**
 * Backend health check.
 *
 * Hits the `/health` endpoint with a short timeout.
 * Does NOT send the x-api-key header (per backend contract).
 *
 * Returns a structured `HealthSnapshot` so the UI can differentiate
 * a fully-up backend from a partially-degraded one (e.g. Firestore failing
 * while Gemini and Maps are fine).
 */
export async function checkHealth(): Promise<HealthSnapshot> {
  // Use a separate try/catch around the axios call so we can still inspect
  // a degraded (non-2xx) response body, which axios surfaces via `err.response`.
  try {
    const res = await apiClient.get('/health', {
      timeout: 5000,
      // Accept any status so the interceptor doesn't reject and we can inspect the body.
      validateStatus: () => true,
    });
    const body = (res.data ?? {}) as {
      status?: string;
      services?: Record<string, ServiceState>;
    };
    const services = body.services ?? {};
    const anyFailing = Object.values(services).some((v) => v !== 'ok');
    const httpOk = res.status >= 200 && res.status < 300;

    let state: HealthSnapshot['state'];
    if (httpOk && !anyFailing) state = 'ok';
    else if (body.status || Object.keys(services).length > 0) state = 'degraded';
    else state = 'down';

    return { state, services, raw: res.data };
  } catch {
    return { state: 'down', services: {} };
  }
}

export default apiClient;
