import { useMemo } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { Courier } from '@/types/domain';

interface CourierSelectProps {
  couriers: Courier[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Courier dropdown powered by shadcn Select.
 *
 * - Populated from live `useCouriers` data
 * - Shows courier name + short ID suffix
 * - Disabled state handled gracefully
 */
export function CourierSelect({ couriers, value, onChange, disabled }: CourierSelectProps) {
  const options = useMemo(
    () =>
      couriers.map((c) => ({
        value: c.id,
        label: c.name,
        status: c.status,
      })),
    [couriers],
  );

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || options.length === 0}>
      <SelectTrigger className="w-full" aria-label="Select courier">
        <SelectValue
          placeholder={options.length === 0 ? 'No couriers available' : 'Choose a courier…'}
        />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            <span className="flex items-center gap-2">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  opt.status === 'delivering'
                    ? 'bg-brand-accent'
                    : opt.status === 'rerouted'
                      ? 'bg-status-warning'
                      : 'bg-text-faint'
                }`}
                aria-hidden="true"
              />
              {opt.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
