// Tujuan    : Status-specific action buttons for order detail
// Caller    : OrderDetailPage
// Dependensi: api.updateOrderStatus, sonner (toast), types/Order
// Main Func : Renders the next legal action button(s) based on current status
// Side Effects: HTTP POST /api/v1/orders/:id/status on tap

import { useState } from 'react';
import { toast } from 'sonner';
import { updateOrderStatus } from '@/services/api';
import type { Order, OrderStatus } from '@/types/domain';
import FailureReasonModal from './FailureReasonModal';

interface OrderActionsProps {
  order: Order;
}

export default function OrderActions({ order }: OrderActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);

  const handleUpdate = async (status: OrderStatus, failureReason?: string) => {
    setIsSubmitting(true);
    try {
      await updateOrderStatus(order.id, status, failureReason);
      toast.success('Status berhasil diperbarui');
    } catch {
      // Error handled by interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextActions: Record<OrderStatus, React.ReactNode> = {
    assigned: (
      <button
        onClick={() => handleUpdate('picked_up')}
        disabled={isSubmitting}
        className="w-full h-12 bg-brand-primary text-white rounded-full font-medium disabled:opacity-50 flex items-center justify-center"
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          'Ambil Paket'
        )}
      </button>
    ),
    picked_up: (
      <button
        onClick={() => handleUpdate('in_transit')}
        disabled={isSubmitting}
        className="w-full h-12 bg-brand-primary text-white rounded-full font-medium disabled:opacity-50 flex items-center justify-center"
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          'Mulai Antar'
        )}
      </button>
    ),
    in_transit: (
      <div className="flex gap-3">
        <button
          onClick={() => handleUpdate('delivered')}
          disabled={isSubmitting}
          className="flex-1 h-12 bg-status-success text-white rounded-full font-medium disabled:opacity-50 flex items-center justify-center"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Selesai'
          )}
        </button>
        <button
          onClick={() => setShowFailureModal(true)}
          disabled={isSubmitting}
          className="flex-1 h-12 bg-status-error text-white rounded-full font-medium disabled:opacity-50"
        >
          Gagal
        </button>
      </div>
    ),
    delivered: (
      <button
        disabled
        className="w-full h-12 bg-surface-offset text-text-faint rounded-full font-medium"
      >
        Pengantaran Selesai
      </button>
    ),
    failed: (
      <button
        disabled
        className="w-full h-12 bg-red-50 text-status-error rounded-full font-medium"
      >
        Pengantaran Gagal
      </button>
    ),
  };

  return (
    <>
      {nextActions[order.status]}
      <FailureReasonModal
        isOpen={showFailureModal}
        onClose={() => setShowFailureModal(false)}
        onSubmit={(reason) => handleUpdate('failed', reason)}
      />
    </>
  );
}
