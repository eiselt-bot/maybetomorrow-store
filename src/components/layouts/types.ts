import type { ReactNode } from 'react';
import type { Shop, Product, DesignTokens } from '@/lib/db/schema';
import type { Rates } from '@/lib/currency';

/**
 * Shared contract for every shop layout variant.
 * Each variant renders the full chrome (header/hero/footer) and slots `children`
 * as the main page body.
 */
export type ShopLayoutProps = {
  shop: Shop;
  products: Product[]; // top 5
  tokens: DesignTokens;
  rates: Rates;
  children?: ReactNode;
};
