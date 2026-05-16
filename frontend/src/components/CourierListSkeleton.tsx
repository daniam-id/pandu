import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the courier list.
 * Renders 3 placeholder rows matching CourierCard shape.
 */
export function CourierListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-sm border border-border bg-white">
          <Skeleton className="w-9 h-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
