import * as React from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'article' | 'section';
}

/**
 * Neutral card surface. Individual layout variants are expected to layer on
 * their own border/shadow/radius via className overrides.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, as: Tag = 'div', ...props }, ref) => {
    return (
      <Tag
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn('bg-white/90 overflow-hidden', className)}
        {...props}
      />
    );
  },
);
Card.displayName = 'Card';

export const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5', className)} {...props} />
  ),
);
CardBody.displayName = 'CardBody';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-[var(--mt-font-display)] text-lg leading-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';
