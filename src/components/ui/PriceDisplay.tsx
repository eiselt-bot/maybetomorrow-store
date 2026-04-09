import * as React from 'react';
import {
  convertFromKes,
  formatCurrency,
  formatKes,
  type Rates,
} from '@/lib/currency';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';

export interface PriceDisplayProps {
  priceKes: number;
  discountPct?: number | null;
  rates: Rates;
  /** Compact mode hides the foreign conversions below (e.g. in product cards on dense grids). */
  compact?: boolean;
  className?: string;
}

/**
 * Multi-currency price display.
 *
 * - Shows the KES price (post-discount) as primary
 * - Shows USD / EUR / CHF smart-rounded conversions below (unless compact)
 * - If discounted, shows crossed-out original + "-X%" red badge
 */
export function PriceDisplay({
  priceKes,
  discountPct,
  rates,
  compact = false,
  className,
}: PriceDisplayProps) {
  const pct = typeof discountPct === 'number' && discountPct > 0 ? discountPct : 0;
  const finalKes = pct > 0 ? Math.round(priceKes * (1 - pct / 100)) : priceKes;

  const usd = convertFromKes(finalKes, rates.usd);
  const eur = convertFromKes(finalKes, rates.eur);
  const chf = convertFromKes(finalKes, rates.chf);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-xl font-bold font-[var(--mt-font-display)] text-[var(--mt-primary)]">
          {formatKes(finalKes)}
        </span>
        {pct > 0 && (
          <>
            <span className="text-sm text-gray-500 line-through">{formatKes(priceKes)}</span>
            <Badge variant="discount" size="sm">
              -{pct}%
            </Badge>
          </>
        )}
      </div>
      {!compact && (
        <div className="flex items-center gap-2 text-xs text-gray-600 font-[var(--mt-font-body)]">
          <span>~ {formatCurrency(usd, 'USD')}</span>
          <span className="opacity-40">·</span>
          <span>~ {formatCurrency(eur, 'EUR')}</span>
          <span className="opacity-40">·</span>
          <span>~ {formatCurrency(chf, 'CHF')}</span>
        </div>
      )}
    </div>
  );
}
