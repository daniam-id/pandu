import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { dispatchOrder } from '@/services/api';

const orderSchema = z.object({
  pickupLat: z.coerce.number().min(-90).max(90),
  pickupLng: z.coerce.number().min(-180).max(180),
  dropoffLat: z.coerce.number().min(-90).max(90),
  dropoffLng: z.coerce.number().min(-180).max(180),
  priority: z.enum(['normal', 'high', 'urgent']).default('normal'),
});

type OrderFormData = z.infer<typeof orderSchema>;

export function OrderForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: { priority: 'normal' },
  });

  const onSubmit = useCallback(
    async (data: OrderFormData) => {
      try {
        await dispatchOrder({
          pickupLocation: { lat: data.pickupLat, lng: data.pickupLng },
          dropoffLocation: { lat: data.dropoffLat, lng: data.dropoffLng },
          priority: data.priority,
        });
        toast.success('Order dispatched');
        reset();
      } catch (err) {
        // User-facing error toast is dispatched by the axios response interceptor
        // in `src/services/api.ts`. Keep console.error here for dev debugging only.
        // eslint-disable-next-line no-console
        console.error('Dispatch order failed:', err);
      }
    },
    [reset],
  );

  const fieldError = (f: keyof OrderFormData) =>
    errors[f] ? 'border-status-error focus-visible:ring-status-error' : '';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-text-muted">Pickup</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" step="any" placeholder="Lat" disabled={isSubmitting}
            className={fieldError('pickupLat')} {...register('pickupLat')} />
          <Input type="number" step="any" placeholder="Lng" disabled={isSubmitting}
            className={fieldError('pickupLng')} {...register('pickupLng')} />
        </div>
        {(errors.pickupLat || errors.pickupLng) && (
          <p className="text-[11px] text-status-error">
            {errors.pickupLat?.message ?? errors.pickupLng?.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-text-muted">Dropoff</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" step="any" placeholder="Lat" disabled={isSubmitting}
            className={fieldError('dropoffLat')} {...register('dropoffLat')} />
          <Input type="number" step="any" placeholder="Lng" disabled={isSubmitting}
            className={fieldError('dropoffLng')} {...register('dropoffLng')} />
        </div>
        {(errors.dropoffLat || errors.dropoffLng) && (
          <p className="text-[11px] text-status-error">
            {errors.dropoffLat?.message ?? errors.dropoffLng?.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-text-muted">Priority</Label>
        <select disabled={isSubmitting}
          className="flex h-10 w-full rounded-sm border border-border bg-white px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 disabled:opacity-50"
          {...register('priority')}>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <Separator className="my-2" />

      <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="w-4 h-4" aria-hidden="true" />
        )}
        {isSubmitting ? 'Dispatching...' : 'Dispatch Order'}
      </Button>
    </form>
  );
}
