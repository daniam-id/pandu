import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * Brand-styled Sonner toaster.
 * Wraps default Sonner with Pandu.ai token classes and sane defaults.
 * Use via `import { toast } from 'sonner'` anywhere in the tree.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-text-primary group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-md',
          description: 'group-[.toast]:text-text-muted',
          actionButton: 'group-[.toast]:bg-brand-primary group-[.toast]:text-text-inverse',
          cancelButton: 'group-[.toast]:bg-surface-offset group-[.toast]:text-text-primary',
        },
      }}
      {...props}
    />
  );
}
