/**
 * GET /api/shop/[slug]/products?ids=1,2,3
 *
 * Public JSON endpoint used by the cart client component to hydrate
 * product details for items stored in localStorage. Only returns
 * products that belong to the specified (live) shop and have status=active.
 *
 * Returns: { products: [{ id, name, priceKes, discountPct, photo }] }
 */

import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const idsParam = url.searchParams.get('ids') ?? '';
  const ids = idsParam
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const [shop] = await db
    .select({ id: schema.shops.id })
    .from(schema.shops)
    .where(and(eq(schema.shops.slug, slug), eq(schema.shops.status, 'live')))
    .limit(1);
  if (!shop) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
  }

  const rows = await db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      priceKes: schema.products.priceKes,
      discountPct: schema.products.discountPct,
      photos: schema.products.photos,
      sizes: schema.products.sizes,
      colors: schema.products.colors,
    })
    .from(schema.products)
    .where(
      and(
        eq(schema.products.shopId, shop.id),
        eq(schema.products.status, 'active'),
        inArray(schema.products.id, ids),
      ),
    );

  const products = rows.map((r) => ({
    id: r.id,
    name: r.name,
    priceKes: r.priceKes,
    discountPct: r.discountPct,
    photo: Array.isArray(r.photos) && r.photos.length > 0 ? r.photos[0] : null,
    sizes: r.sizes,
    colors: r.colors,
  }));

  return NextResponse.json({ products });
}

export const runtime = 'nodejs';
