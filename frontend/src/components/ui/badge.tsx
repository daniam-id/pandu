import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-brand-primary text-text-inverse',
        secondary: 'border-transparent bg-surface-offset text-text-primary',
        destructive: 'border-transparent bg-status-error text-text-inverse',
        outline: 'border-border text-text-primary bg-transparent',
        success: 'border-transparent bg-status-success/20 text-brand-primary',
        warning: 'border-transparent bg-status-warning/20 text-status-warning',
        accent: 'border-brand-accent/30 text-brand-accent bg-brand-accent/10',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// `badgeVariants` is intentionally co-located with `Badge` per shadcn/ui convention.
// eslint-disable-next-line react-refresh/only-export-components
export { badgeVariants };
