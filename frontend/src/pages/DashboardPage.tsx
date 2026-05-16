import { useState } from 'react';
import { PanelLeftOpen } from 'lucide-react';
import { MapView } from '@/components/MapView';
import { ControlPanel } from '@/components/ControlPanel';
import { CourierSimulatorButton } from '@/components/CourierSimulatorButton';
import { CourierSimulator } from '@/components/CourierSimulator';
import { MobileDrawer } from '@/components/MobileDrawer';
import { useCouriers } from '@/hooks/useCouriers';
import { useOrders } from '@/hooks/useOrders';

/**
 * Cycle 2: three-panel shell with stub content.
 * Cycle 4: center panel replaced by <MapView /> with live Firestore hooks.
 * Cycle 5: left panel replaced by <ControlPanel /> (OrderForm + CourierList).
 * Cycle 7: floating courier simulator button + dialog wired.
 */
export default function DashboardPage() {
  const { data: couriers, loading: couriersLoading } = useCouriers();
  const { data: orders, loading: ordersLoading } = useOrders();
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 p-4 overflow-hidden">
      {/* LEFT — Control Panel (desktop only) */}
      <div className="hidden lg:block min-h-0">
        <ControlPanel couriers={couriers} loading={couriersLoading} />
      </div>

      {/* CENTER — Live MapView */}
      <section aria-label="Map view" className="relative flex flex-col min-h-[300px] lg:min-h-[400px]">
        <MapView couriers={couriers} orders={orders} loading={ordersLoading} />

        {/* Mobile drawer triggers */}
        <MobileDrawer
          side="left"
          triggerIcon={<PanelLeftOpen className="w-5 h-5" />}
          triggerLabel="Orders"
          triggerClassName="top-4 left-4"
          title="Open orders panel"
        >
          <ControlPanel couriers={couriers} loading={couriersLoading} />
        </MobileDrawer>

        <CourierSimulatorButton onOpen={() => setSimulatorOpen(true)} />
      </section>

      {/* Courier Simulator Dialog */}
      <CourierSimulator
        open={simulatorOpen}
        onOpenChange={setSimulatorOpen}
        couriers={couriers}
      />
    </div>
  );
}
