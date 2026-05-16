import { cn } from '@/lib/utils';

/**
 * Skeleton loading placeholder.
 * Apply to any container to show an animated pulse block.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-sm bg-surface-offset', className)}
      {...props}
    />
  );
}

export { Skeleton };
