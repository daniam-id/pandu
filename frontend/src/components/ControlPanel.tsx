import { Package, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { OrderForm } from './OrderForm';
import { CourierList } from './CourierList';
import type { Courier } from '@/types/domain';

interface ControlPanelProps {
  couriers: Courier[];
  loading: boolean;
}

/**
 * Left sidebar: stacks OrderForm on top + CourierList on bottom.
 * Scrollable inside its card container.
 */
export function ControlPanel({ couriers, loading }: ControlPanelProps) {
  return (
    <aside aria-label="Control panel" className="flex flex-col min-h-[300px]">
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* OrderForm header */}
        <CardHeader className="p-4 pb-2 shrink-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            New Order
          </CardTitle>
          <CardDescription className="text-xs">
            Enter pickup & dropoff coordinates to dispatch.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2 shrink-0">
          <OrderForm />
        </CardContent>

        <Separator className="mx-4 w-auto" />

        {/* CourierList header */}
        <CardHeader className="p-4 pb-2 shrink-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            Couriers
          </CardTitle>
          <CardDescription className="text-xs">
            Live status from Firestore.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-1 overflow-auto min-h-0">
          <CourierList couriers={couriers} loading={loading} />
        </CardContent>
      </Card>
    </aside>
  );
}
