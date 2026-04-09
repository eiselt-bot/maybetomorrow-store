import { cache } from 'react';
import { and, eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { db, schema } from '@/lib/db/client';
import { getLatestRates } from '@/lib/currency';
import type { Shop, Product } from '@/lib/db/schema';
import type { Rates } from '@/lib/currency';

export type LoadedShop = {
  shop: Shop;
  products: Product[];
  rates: Rates;
};

/**
 * Load shop + top-5 products + latest currency rates for a given slug.
 *
 * Wrapped with React `cache()` so layout.tsx and page.tsx share the same
 * request-scoped DB read (Next.js automatically dedupes).
 *
 * Calls `notFound()` when the shop doesn't exist or isn't live — this
 * surfaces the standard Next 404 page.
 */
export const loadShop = cache(async (slug: string): Promise<LoadedShop> => {
  const rows = await db
    .select()
    .from(schema.shops)
    .where(and(eq(schema.shops.slug, slug), eq(schema.shops.status, 'live')))
    .limit(1);

  const shop = rows[0];
  if (!shop) {
    notFound();
  }

  const products = await db
    .select()
    .from(schema.products)
    .where(
      and(
        eq(schema.products.shopId, shop.id),
        eq(schema.products.isTop5, true),
        eq(schema.products.status, 'active'),
      ),
    )
    .orderBy(desc(schema.products.soldCount))
    .limit(5);

  const rates = await getLatestRates();

  return { shop, products, rates };
});

/**
 * Fetch a single product (any status) by id within a shop.
 * Returns null if not found.
 */
export const loadProduct = cache(
  async (slug: string, productId: number): Promise<{
    shop: Shop;
    product: Product;
  } | null> => {
    const shopRows = await db
      .select()
      .from(schema.shops)
      .where(and(eq(schema.shops.slug, slug), eq(schema.shops.status, 'live')))
      .limit(1);
    const shop = shopRows[0];
    if (!shop) return null;

    const productRows = await db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, productId), eq(schema.products.shopId, shop.id)))
      .limit(1);
    const product = productRows[0];
    if (!product) return null;

    return { shop, product };
  },
);
