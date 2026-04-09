import { db, schema } from '@/lib/db/client';
import { desc } from 'drizzle-orm';

/**
 * Fallback rates (approximate, used when DB has no rows).
 * 1 KES = X foreign.
 */
const FALLBACK_RATES = {
  usd: 0.0077,
  eur: 0.0071,
  chf: 0.007,
} as const;

export type CurrencyCode = 'USD' | 'EUR' | 'CHF';

export type Rates = {
  usd: number;
  eur: number;
  chf: number;
};

/**
 * Smart-round a floating point value UP to the nearest .5.
 * Example: 10.1 -> 10.5, 10.6 -> 11.0, 10.0 -> 10.0.
 * This keeps foreign currency prices clean ("$10.5" not "$10.37").
 */
export function smartRoundUp(value: number): number {
  return Math.ceil(value * 2) / 2;
}

/**
 * Convert a KES price into a foreign currency using the given rate.
 * Applies smart rounding for a clean display value.
 */
export function convertFromKes(priceKes: number, rate: number): number {
  return smartRoundUp(priceKes * rate);
}

/**
 * Format a KES value with thousands separators: "KES 1,500".
 */
export function formatKes(value: number): string {
  const rounded = Math.round(value);
  return `KES ${rounded.toLocaleString('en-US')}`;
}

/**
 * Format a foreign currency value with the proper symbol/prefix.
 * Example: formatCurrency(15, 'USD') -> "$ 15.0"
 */
export function formatCurrency(value: number, code: CurrencyCode): string {
  const symbols: Record<CurrencyCode, string> = {
    USD: '$',
    EUR: '€',
    CHF: 'CHF',
  };
  // Always show one decimal for the smart-rounded look
  const formatted = value.toFixed(1);
  return `${symbols[code]} ${formatted}`;
}

/**
 * Load the most recent currency rates from the DB.
 * Falls back to hardcoded defaults if the table is empty or on error.
 * Safe to call in server components.
 */
export async function getLatestRates(): Promise<Rates> {
  try {
    const rows = await db
      .select()
      .from(schema.currencyRates)
      .orderBy(desc(schema.currencyRates.fetchedAt))
      .limit(1);

    if (rows.length === 0) {
      return { ...FALLBACK_RATES };
    }

    const row = rows[0];
    const usd = Number(row.usd);
    const eur = Number(row.eur);
    const chf = Number(row.chf);

    return {
      usd: Number.isFinite(usd) && usd > 0 ? usd : FALLBACK_RATES.usd,
      eur: Number.isFinite(eur) && eur > 0 ? eur : FALLBACK_RATES.eur,
      chf: Number.isFinite(chf) && chf > 0 ? chf : FALLBACK_RATES.chf,
    };
  } catch {
    return { ...FALLBACK_RATES };
  }
}
