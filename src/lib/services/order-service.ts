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

/**
 * Flat delivery fees in KES, keyed by zone — cached in memory for the
 * lifetime of the process. The source of truth is the `delivery_fees`
 * table which the admin can edit. `invalidateDeliveryFeeCache()` is
 * called from the admin action after each update.
 */
let feeCache: Record<string, number> | null = null;
let feeCacheLabels: Record<string, string> | null = null;

export function invalidateDeliveryFeeCache(): void {
  feeCache = null;
  feeCacheLabels = null;
}

async function loadFees(): Promise<Record<string, number>> {
  if (feeCache) return feeCache;
  const rows = await db.select().from(schema.deliveryFees);
  const map: Record<string, number> = {};
  const labels: Record<string, string> = {};
  for (const r of rows) {
    map[r.zone] = r.feeKes;
    labels[r.zone] = r.label;
  }
  feeCache = map;
  feeCacheLabels = labels;
  return map;
}

/** Fallback values — used only if the DB row is missing. */
const FALLBACK_FEES: Record<DeliveryZone, number> = {
  'diani-strip': 200,
  'south-coast': 500,
  mombasa: 1500,
  further: 3000,
};

export async function getDeliveryFeeKes(zone: DeliveryZone): Promise<number> {
  const fees = await loadFees();
  return fees[zone] ?? FALLBACK_FEES[zone];
}

export async function getAllDeliveryFees(): Promise<
  Array<{ zone: DeliveryZone; label: string; feeKes: number }>
> {
  const rows = await db.select().from(schema.deliveryFees).orderBy(schema.deliveryFees.feeKes);
  return rows.map((r) => ({
    zone: r.zone as DeliveryZone,
    label: r.label,
    feeKes: r.feeKes,
  }));
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
  variantSelection: string | null;
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
export function computeLine(product: Product, qty: number) {
  const grossUnit = product.priceKes;
  const netUnit = Math.round(grossUnit * (1 - product.discountPct / 100));
  const lineTotal = netUnit * qty;
  return { unitPriceKes: grossUnit, netUnitKes: netUnit, lineTotalKes: lineTotal };
}

/** Generate a short, human-readable order number. */
export function generateOrderNumber(): string {
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
  const deliveryFeeKes = await getDeliveryFeeKes(input.deliveryZone);

  const line = computeLine(product, qty);
  const productsSubtotalKes = line.lineTotalKes;
  const lineMarginKes = Math.round(line.lineTotalKes * (marginPct / 100));
  const totalKes = productsSubtotalKes + deliveryFeeKes + lineMarginKes;

  const orderNumber = generateOrderNumber();

  // Drizzle doesn't ship transactions on neon-http, but on node-postgres it works.
  // We do two inserts back-to-back; if the second fails, we delete the first.
  const [orderRow] = await db.transaction(async (tx) => {
    const [inserted] = await tx
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

    await tx.insert(schema.orderItems).values({
      orderId: inserted.id,
      shopId: shop.id,
      productId: product.id,
      qty,
      unitPriceKes: line.unitPriceKes,
      discountPct: product.discountPct,
      lineTotalKes: line.lineTotalKes,
      marginKes: lineMarginKes,
      isCrossSell: false,
      variantSelection: input.variantSelection ?? null,
    });

    return [inserted];
  });

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

// ============================================================================
// Multi-item cart order
// ============================================================================

export type CartLine = {
  productId: number;
  qty: number;
  variantSize?: string | null;
  variantColor?: string | null;
};

export type CreateCartOrderInput = {
  shop: Shop;
  lines: CartLine[];
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

export async function createOrderFromCart(
  input: CreateCartOrderInput,
): Promise<CreatedOrder> {
  const { shop, lines } = input;

  if (lines.length === 0) {
    throw new Error('Cart is empty');
  }

  // Load all products for the cart (from this shop, active)
  const productIds = [...new Set(lines.map((l) => l.productId))];
  const products = await db
    .select()
    .from(schema.products)
    .where(
      and(
        eq(schema.products.shopId, shop.id),
        eq(schema.products.status, 'active'),
      ),
    );
  const byId = new Map(products.map((p) => [p.id, p]));

  // Validate every cart line has a matching product
  for (const line of lines) {
    const prod = byId.get(line.productId);
    if (!prod) {
      throw new Error(`Product ${line.productId} not found or unavailable`);
    }
    if (line.qty < 1 || line.qty > 50) {
      throw new Error(`Invalid quantity ${line.qty} for product ${prod.name}`);
    }
  }

  const marginPct = Number(process.env.PLATFORM_MARGIN_PCT ?? '10');
  const deliveryFeeKes = await getDeliveryFeeKes(input.deliveryZone);

  // Compute line economics
  const itemRows: Array<{
    shopId: number;
    productId: number;
    qty: number;
    unitPriceKes: number;
    discountPct: number;
    lineTotalKes: number;
    marginKes: number;
    isCrossSell: boolean;
    variantSelection: string | null;
  }> = [];
  let productsSubtotalKes = 0;
  let totalMarginKes = 0;

  for (const line of lines) {
    const prod = byId.get(line.productId)!;
    const netUnit = Math.round(prod.priceKes * (1 - prod.discountPct / 100));
    const lineTotal = netUnit * line.qty;
    const lineMargin = Math.round(lineTotal * (marginPct / 100));

    const variantParts: string[] = [];
    if (line.variantSize) variantParts.push(`Size: ${line.variantSize}`);
    if (line.variantColor) variantParts.push(`Color: ${line.variantColor}`);
    const variantSelection = variantParts.length > 0 ? variantParts.join(', ') : null;

    productsSubtotalKes += lineTotal;
    totalMarginKes += lineMargin;

    itemRows.push({
      shopId: shop.id,
      productId: prod.id,
      qty: line.qty,
      unitPriceKes: prod.priceKes,
      discountPct: prod.discountPct,
      lineTotalKes: lineTotal,
      marginKes: lineMargin,
      isCrossSell: false,
      variantSelection,
    });
  }

  const totalKes = productsSubtotalKes + deliveryFeeKes + totalMarginKes;
  const orderNumber = generateOrderNumber();

  const [orderRow] = await db.transaction(async (tx) => {
    const [inserted] = await tx
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
      marginKes: totalMarginKes,
      totalKes,
      paymentMethod: 'cash',
      status: 'new',
      newsletterOptin: input.newsletterOptin,
      notes: input.notes,
    })
    .returning({ id: schema.orders.id });

    await tx.insert(schema.orderItems).values(
      itemRows.map((r) => ({ ...r, orderId: inserted.id })),
    );

    return [inserted];
  });

  return {
    orderId: orderRow.id,
    orderNumber,
    totalKes,
    productsSubtotalKes,
    marginKes: totalMarginKes,
    deliveryFeeKes,
  };
}
