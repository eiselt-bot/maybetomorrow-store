import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap font-semibold leading-none',
  {
    variants: {
      variant: {
        discount: 'bg-red-500 text-white',
        primary: 'bg-[var(--mt-primary)] text-white',
        accent: 'bg-[var(--mt-accent)] text-black',
        outline: 'border border-current bg-transparent',
        muted: 'bg-black/10 text-black',
      },
      size: {
        sm: 'text-[10px] px-1.5 py-0.5 rounded',
        md: 'text-xs px-2 py-1 rounded-md',
        lg: 'text-sm px-3 py-1.5 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
