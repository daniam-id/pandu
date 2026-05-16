// Tujuan    : Show route map with current position, pickup, dropoff, and turn-by-turn
// Caller    : routes.tsx (/route/:orderId?)
// Dependensi: RouteMap, TurnByTurn, useParams, useNavigate
// Main Func : Renders map + step list for selected order, or prompt if none
// Side Effects: Google Maps JS API load (RouteMap)

import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, MapPin } from 'lucide-react';
import RouteMap from '@/components/RouteMap';
import TurnByTurn from '@/components/TurnByTurn';
import { useDriverOrders } from '@/hooks/useDriverOrders';

export default function RoutePage() {
  const { orderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();
  const { data: orders } = useDriverOrders();
  const order = orderId ? orders.find((o) => o.id === orderId) : undefined;

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-border h-12 flex items-center px-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Kembali"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold text-text-primary ml-1">Rute</h1>
      </header>

      {!order ? (
        <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
          <MapPin size={48} className="text-text-faint mb-3" />
          <h2 className="text-base font-medium text-text-primary mb-1">Pilih orderan dulu</h2>
          <p className="text-sm text-text-muted mb-4">
            Pilih orderan dari daftar untuk melihat rute pengantaran
          </p>
          <Link
            to="/orders"
            className="px-6 py-3 bg-brand-primary text-white rounded-full font-medium"
          >
            Lihat Orderan
          </Link>
        </div>
      ) : (
        <div className="flex flex-col flex-1">
          <div className="h-[50vh] relative">
            <RouteMap order={order} />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <TurnByTurn orderId={order.id} />
          </div>
        </div>
      )}
    </div>
  );
}
