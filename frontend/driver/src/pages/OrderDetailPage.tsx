// Tujuan    : Display full order details and status update actions
// Caller    : routes.tsx (/orders/:orderId)
// Dependensi: useDriverOrders, useNavigate, useParams, OrderActions, StatusTimeline, AddressCard
// Main Func : Renders order detail with timeline, addresses, and action buttons
// Side Effects: Firestore onSnapshot (via useDriverOrders)

import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useDriverOrders } from '@/hooks/useDriverOrders';
import { formatTime } from '@/utils/formatTime';
import StatusTimeline from '@/components/StatusTimeline';
import AddressCard from '@/components/AddressCard';
import OrderActions from '@/components/OrderActions';

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: orders, loading } = useDriverOrders();

  const order = orders.find((o) => o.id === orderId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <p className="text-text-muted">Order tidak ditemukan</p>
        <button
          onClick={() => navigate('/orders')}
          className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-full text-sm"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-border h-12 flex items-center px-2">
        <button
          onClick={() => navigate('/orders')}
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Kembali"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold text-text-primary ml-1">Detail Order</h1>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {/* Order info */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-mono text-text-faint">{order.id.slice(0, 12)}</span>
          {order.priority >= 4 && (
            <span className="px-2 py-0.5 bg-status-warning/10 text-status-warning text-xs rounded-full font-medium">
              Prioritas {order.priority}
            </span>
          )}
        </div>

        <p className="text-xs text-text-faint">{formatTime(order.createdAt)}</p>

        {/* Status Timeline */}
        <StatusTimeline status={order.status} />

        {/* Addresses */}
        <div className="space-y-3">
          <AddressCard
            label="Alamat Pickup"
            name={order.pickup.name}
            phone={order.pickup.phone}
            address={order.pickup.address}
            notes={order.pickup.notes}
            lat={order.pickup.lat}
            lng={order.pickup.lng}
          />
          <AddressCard
            label="Alamat Dropoff"
            name={order.dropoff.name}
            phone={order.dropoff.phone}
            address={order.dropoff.address}
            notes={order.dropoff.notes}
            lat={order.dropoff.lat}
            lng={order.dropoff.lng}
          />
        </div>

        {/* Package info */}
        <div className="bg-surface rounded-lg p-4">
          <h3 className="text-sm font-medium text-text-primary mb-1">Isi Paket</h3>
          <p className="text-sm text-text-muted">{order.items}</p>
        </div>
      </div>

      {/* Sticky actions */}
      <div className="sticky bottom-0 bg-white border-t border-border p-4 pb-20">
        <OrderActions order={order} />
      </div>
    </div>
  );
}
