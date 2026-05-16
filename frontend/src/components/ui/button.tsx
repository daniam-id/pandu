import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-brand-primary text-text-inverse hover:bg-brand-primary-hover shadow-sm',
        destructive: 'bg-status-error text-text-inverse hover:bg-status-error/90 shadow-sm',
        outline:
          'border border-border bg-white hover:bg-surface-offset text-text-primary shadow-sm',
        secondary: 'bg-surface-offset text-text-primary hover:bg-surface-offset/80',
        ghost: 'hover:bg-surface-offset text-text-primary',
        link: 'text-brand-primary underline-offset-4 hover:underline',
        accent: 'bg-brand-accent text-brand-primary hover:bg-brand-accent-hover shadow-sm',
      },
      size: {
        default: 'h-10 px-4 py-2 min-w-[44px]',
        sm: 'h-9 rounded-sm px-3',
        lg: 'h-11 rounded-full px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

// `buttonVariants` is intentionally co-located with `Button` per shadcn/ui convention.
// eslint-disable-next-line react-refresh/only-export-components
export { buttonVariants };
