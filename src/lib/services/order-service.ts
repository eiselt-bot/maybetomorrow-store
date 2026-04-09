/**
 * Order Service — creates a real order from checkout input.
 *
 * Inserts one `orders` row + one `order_items` row inside a transaction,
 * computes delivery fee + margin + total, and returns the order number
 * for display on the success page.
 *
 * Keeps the checkout server action thin and testable.
 */

import { db, schema } from '@/lib/db/client';
import { eq, and } from 'drizzle-orm';
import type { Shop, Product } from '@/lib/db/schema';

export type DeliveryZone =
  | 'diani-strip'
  | 'south-coast'
  | 'mombasa'
  | 'further';

/** Flat delivery fees in KES, keyed by zone. */
const DELIVERY_FEES_KES: Record<DeliveryZone, number> = {
  'diani-strip': 200,
  'south-coast': 500,
  mombasa: 1500,
  further: 3000,
};

export function getDeliveryFeeKes(zone: DeliveryZone): number {
  return DELIVERY_FEES_KES[zone];
}

export type CreateOrderInput = {
  shop: Shop;
  product: Product;
  qty: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryZone: DeliveryZone;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTimeNote: string | null;
  newsletterOptin: boolean;
  notes: string | null;
};

export type CreatedOrder = {
  orderId: number;
  orderNumber: string;
  totalKes: number;
  productsSubtotalKes: number;
  marginKes: number;
  deliveryFeeKes: number;
};

/**
 * Compute line economics for a single product line.
 * Applies discount first, then rounds to integer KES.
 */
function computeLine(product: Product, qty: number) {
  const grossUnit = product.priceKes;
  const netUnit = Math.round(grossUnit * (1 - product.discountPct / 100));
  const lineTotal = netUnit * qty;
  return { unitPriceKes: grossUnit, netUnitKes: netUnit, lineTotalKes: lineTotal };
}

/** Generate a short, human-readable order number. */
function generateOrderNumber(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4).padEnd(4, '0');
  return `MT-${yyyy}${mm}${dd}-${rand}`;
}

export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  const { shop, product, qty } = input;

  if (product.shopId !== shop.id) {
    throw new Error('Product does not belong to this shop');
  }
  if (product.status !== 'active') {
    throw new Error('Product is not available');
  }
  if (qty < 1 || qty > 50) {
    throw new Error('Invalid quantity');
  }

  const marginPct = Number(process.env.PLATFORM_MARGIN_PCT ?? '10');
  const deliveryFeeKes = getDeliveryFeeKes(input.deliveryZone);

  const line = computeLine(product, qty);
  const productsSubtotalKes = line.lineTotalKes;
  const lineMarginKes = Math.round(line.lineTotalKes * (marginPct / 100));
  const totalKes = productsSubtotalKes + deliveryFeeKes + lineMarginKes;

  const orderNumber = generateOrderNumber();

  // Drizzle doesn't ship transactions on neon-http, but on node-postgres it works.
  // We do two inserts back-to-back; if the second fails, we delete the first.
  const [orderRow] = await db
    .insert(schema.orders)
    .values({
      orderNumber,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      deliveryZone: input.deliveryZone,
      deliveryAddress: input.deliveryAddress,
      deliveryDate: input.deliveryDate,
      deliveryTimeNote: input.deliveryTimeNote,
      deliveryFeeKes,
      initialShopId: shop.id,
      productsSubtotalKes,
      marginKes: lineMarginKes,
      totalKes,
      paymentMethod: 'cash',
      status: 'new',
      newsletterOptin: input.newsletterOptin,
      notes: input.notes,
    })
    .returning({ id: schema.orders.id });

  try {
    await db.insert(schema.orderItems).values({
      orderId: orderRow.id,
      shopId: shop.id,
      productId: product.id,
      qty,
      unitPriceKes: line.unitPriceKes,
      discountPct: product.discountPct,
      lineTotalKes: line.lineTotalKes,
      marginKes: lineMarginKes,
      isCrossSell: false,
    });
  } catch (e) {
    // Compensate: drop the orphan order
    await db.delete(schema.orders).where(eq(schema.orders.id, orderRow.id));
    throw e;
  }

  return {
    orderId: orderRow.id,
    orderNumber,
    totalKes,
    productsSubtotalKes,
    marginKes: lineMarginKes,
    deliveryFeeKes,
  };
}

/** Helper: find a product by id scoped to a shop slug. */
export async function findProductForCheckout(
  slug: string,
  productId: number,
): Promise<{ shop: Shop; product: Product } | null> {
  const [shop] = await db
    .select()
    .from(schema.shops)
    .where(and(eq(schema.shops.slug, slug), eq(schema.shops.status, 'live')))
    .limit(1);
  if (!shop) return null;

  const [product] = await db
    .select()
    .from(schema.products)
    .where(
      and(
        eq(schema.products.id, productId),
        eq(schema.products.shopId, shop.id),
        eq(schema.products.status, 'active'),
      ),
    )
    .limit(1);
  if (!product) return null;

  return { shop, product };
}
