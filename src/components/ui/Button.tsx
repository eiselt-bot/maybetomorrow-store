import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-medium transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'cursor-pointer select-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--mt-primary)] text-white hover:opacity-90 focus-visible:ring-[var(--mt-primary)]',
        secondary:
          'bg-[var(--mt-secondary)] text-white hover:opacity-90 focus-visible:ring-[var(--mt-secondary)]',
        accent:
          'bg-[var(--mt-accent)] text-black hover:opacity-90 focus-visible:ring-[var(--mt-accent)]',
        outline:
          'border-2 border-[var(--mt-primary)] text-[var(--mt-primary)] bg-transparent hover:bg-[var(--mt-primary)] hover:text-white',
        ghost: 'bg-transparent text-[var(--mt-primary)] hover:bg-black/5',
        link: 'text-[var(--mt-primary)] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-9 px-3 text-sm rounded-md',
        md: 'h-11 px-5 text-base rounded-lg',
        lg: 'h-14 px-8 text-lg rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
