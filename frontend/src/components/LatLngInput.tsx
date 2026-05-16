import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface LatLngInputProps {
  label: string;
  latName: string;
  lngName: string;
  latError?: string;
  lngError?: string;
  disabled?: boolean;
}

/**
 * Reusable labeled latitude/longitude pair.
 * Composes shadcn Label + Input with side-by-side layout.
 */
export function LatLngInput({
  label,
  latName,
  lngName,
  latError,
  lngError,
  disabled,
}: LatLngInputProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-text-muted">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Input
            type="number"
            step="any"
            placeholder="Lat"
            name={latName}
            disabled={disabled}
            className={latError ? 'border-status-error focus-visible:ring-status-error' : ''}
            aria-invalid={!!latError}
            aria-describedby={latError ? `${latName}-error` : undefined}
          />
          {latError && (
            <p id={`${latName}-error`} className="text-[11px] text-status-error mt-0.5">
              {latError}
            </p>
          )}
        </div>
        <div>
          <Input
            type="number"
            step="any"
            placeholder="Lng"
            name={lngName}
            disabled={disabled}
            className={lngError ? 'border-status-error focus-visible:ring-status-error' : ''}
            aria-invalid={!!lngError}
            aria-describedby={lngError ? `${lngName}-error` : undefined}
          />
          {lngError && (
            <p id={`${lngName}-error`} className="text-[11px] text-status-error mt-0.5">
              {lngError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
