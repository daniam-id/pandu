// Tujuan    : Display real-time list of assigned orders for the courier
// Caller    : routes.tsx (/orders)
// Dependensi: useDriverOrders, OrderCard, OrdersEmpty, OrdersSkeleton, useNavigate
// Main Func : Renders scrollable orders list with header, count badge, loading/empty/error states
// Side Effects: Firestore onSnapshot listener (mount/unmount via useDriverOrders)

import { useNavigate } from 'react-router-dom';
import { useDriverOrders } from '@/hooks/useDriverOrders';
import { Package } from 'lucide-react';

export default function OrdersPage() {
  const { data: orders, loading, error } = useDriverOrders();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-border h-12 flex items-center px-4">
        <h1 className="text-lg font-semibold text-text-primary">Orderan Hari Ini</h1>
        {orders.length > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-brand-primary text-white text-xs rounded-full font-medium">
            {orders.length}
          </span>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 p-4 space-y-3">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-surface rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-12">
            <p className="text-status-error text-sm">Gagal memuat orderan</p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package size={48} className="text-text-faint mb-3" />
            <h2 className="text-base font-medium text-text-primary mb-1">Belum ada orderan</h2>
            <p className="text-sm text-text-muted">Orderan akan muncul saat dispatcher menugaskan</p>
          </div>
        )}

        {!loading && !error && orders.map((order) => (
          <button
            key={order.id}
            onClick={() => navigate(`/orders/${order.id}`)}
            className="w-full text-left bg-white border border-border rounded-lg p-4 shadow-sm active:bg-surface transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-faint">{order.id.slice(0, 8)}</span>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                order.status === 'assigned' && 'bg-gray-100 text-gray-600',
                order.status === 'picked_up' && 'bg-blue-50 text-blue-600',
                order.status === 'in_transit' && 'bg-brand-primary/10 text-brand-primary',
                order.status === 'delivered' && 'bg-green-50 text-green-600',
                order.status === 'failed' && 'bg-red-50 text-red-600',
              )}>
                {order.status === 'assigned' && 'Diterima'}
                {order.status === 'picked_up' && 'Diambil'}
                {order.status === 'in_transit' && 'Dalam Perjalanan'}
                {order.status === 'delivered' && 'Selesai'}
                {order.status === 'failed' && 'Gagal'}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-text-muted truncate">
                <span className="font-medium text-text-primary">Dari:</span> {order.pickup.address}
              </p>
              <p className="text-sm text-text-muted truncate">
                <span className="font-medium text-text-primary">Ke:</span> {order.dropoff.address}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Inline cn import to avoid circular dependency during build
function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
