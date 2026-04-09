'use server';

/**
 * Server actions for the public checkout flow.
 * No auth required — these are customer-facing actions.
 *
 * Validates the form with Zod, calls createOrder(), and on success
 * redirects to the per-shop success page with the order number in the
 * URL. On failure, redirects back to the checkout page with an error
 * query param.
 */

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  createOrder,
  findProductForCheckout,
  type CreateOrderInput,
  type DeliveryZone,
} from '@/lib/services/order-service';

const schema = z.object({
  name: z.string().trim().min(1, 'Name required').max(200),
  phone: z
    .string()
    .trim()
    .min(5, 'Phone required')
    .max(40)
    .regex(/^[\d+\s()-]+$/, 'Invalid phone format'),
  email: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine((v) => v === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), {
      message: 'Invalid email',
    }),
  zone: z.enum(['diani-strip', 'south-coast', 'mombasa', 'further']),
  deliveryDate: z.string().min(1, 'Delivery date required').max(40),
  deliveryTimeNote: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  address: z.string().trim().min(3, 'Address required').max(1000),
  qty: z.coerce.number().int().min(1).max(50).default(1),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  newsletterOptin: z
    .union([z.literal('on'), z.literal('off'), z.undefined()])
    .transform((v) => v === 'on'),
  variantSize: z.string().trim().max(80).optional().transform(v => v || null),
  variantColor: z.string().trim().max(80).optional().transform(v => v || null),
});

function buildErrorRedirect(
  slug: string,
  productId: number,
  message: string,
  formData?: FormData,
): never {
  const params = new URLSearchParams({
    product: String(productId),
    error: message,
  });
  // Preserve user input so they don't lose what they typed
  if (formData) {
    for (const key of ['name', 'phone', 'email', 'zone', 'address', 'deliveryDate', 'notes', 'qty']) {
      const v = formData.get(key);
      if (typeof v === 'string' && v.length > 0) {
        params.set(`f_${key}`, v);
      }
    }
  }
  redirect(`/shop/${slug}/checkout?${params.toString()}`);
}

export async function placeOrderForm(
  slug: string,
  productId: number,
  formData: FormData,
): Promise<void> {
  // 1) Validate the form
  const raw = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    zone: formData.get('zone'),
    deliveryDate: formData.get('deliveryDate'),
    deliveryTimeNote: formData.get('deliveryTimeNote'),
    address: formData.get('address'),
    qty: formData.get('qty') ?? '1',
    notes: formData.get('notes'),
    newsletterOptin: formData.get('newsletterOptin') ?? 'off',
    variantSize: formData.get('variant_size'),
    variantColor: formData.get('variant_color'),
  };
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid form data';
    buildErrorRedirect(slug, productId, msg, formData);
  }
  const data = parsed.data!;

  // 2) Load shop + product
  const found = await findProductForCheckout(slug, productId);
  if (!found) {
    buildErrorRedirect(slug, productId, 'Product not found or unavailable');
  }
  const { shop, product } = found!;

  // 3) Create the order
  const variantParts: string[] = [];
  if (data.variantSize) variantParts.push(`Size: ${data.variantSize}`);
  if (data.variantColor) variantParts.push(`Color: ${data.variantColor}`);
  const variantSelection = variantParts.length > 0 ? variantParts.join(', ') : null;

  const input: CreateOrderInput = {
    shop,
    product,
    qty: data.qty,
    customerName: data.name,
    customerPhone: data.phone,
    customerEmail: data.email,
    deliveryZone: data.zone as DeliveryZone,
    deliveryAddress: data.address,
    deliveryDate: data.deliveryDate,
    deliveryTimeNote: data.deliveryTimeNote,
    newsletterOptin: data.newsletterOptin,
    variantSelection,
    notes: data.notes,
  };

  let created;
  try {
    created = await createOrder(input);
  } catch (e) {
    const msg = (e as Error).message || 'Order creation failed';
    console.error('[placeOrderForm]', msg);
    buildErrorRedirect(slug, productId, msg, formData);
  }

  // 4b) Write newsletter opt-in through (if opted in)
  if (data.newsletterOptin && (data.email || data.phone)) {
    try {
      // Import lazily to avoid pulling into module init
      const { db: _db, schema: _schema } = await import('@/lib/db/client');
      await _db.insert(_schema.newsletterOptins).values({
        email: data.email,
        phone: data.phone,
        sourceOrderId: created!.orderId,
        sourceShopId: shop.id,
      });
    } catch (e) {
      console.warn('[placeOrderForm] newsletter writethrough failed', (e as Error).message);
    }
  }

  // 4) Revalidate admin caches + redirect to success
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/shops/${shop.id}`);
  redirect(
    `/shop/${slug}/checkout/success?order=${encodeURIComponent(created!.orderNumber)}`,
  );
}

// ============================================================================
// Admin: update order status
// ============================================================================

import { auth } from '@/lib/auth';

import { db, schema as dbSchema } from '@/lib/db/client';
import { eq } from 'drizzle-orm';

const ORDER_STATUS_VALUES = ['new', 'confirmed', 'picked_up', 'delivered', 'cancelled', 'refunded'] as const;
type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export async function updateOrderStatusForm(
  orderId: number,
  formData: FormData,
): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    redirect('/admin/login');
  }

  const raw = String(formData.get('status') ?? '');
  if (!ORDER_STATUS_VALUES.includes(raw as OrderStatus)) {
    redirect('/admin/orders?error=Invalid+status');
  }
  const status = raw as OrderStatus;

  const patch: Record<string, unknown> = { status };
  if (status === 'confirmed') patch.confirmedAt = new Date();
  if (status === 'delivered') patch.deliveredAt = new Date();

  const [row] = await db
    .update(dbSchema.orders)
    .set(patch)
    .where(eq(dbSchema.orders.id, orderId))
    .returning({ orderNumber: dbSchema.orders.orderNumber });

  if (!row) {
    redirect('/admin/orders?error=Order+not+found');
  }

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${encodeURIComponent(row.orderNumber)}`);
  redirect(`/admin/orders/${encodeURIComponent(row.orderNumber)}?ok=1`);
}

// ============================================================================
// Multi-item cart checkout
// ============================================================================

import {
  createOrderFromCart,
  type CartLine,
  type CreateCartOrderInput,
} from '@/lib/services/order-service';
import { eq as _eq, and as _and } from 'drizzle-orm';

const cartSchema = z.object({
  name: z.string().trim().min(1, 'Name required').max(200),
  phone: z
    .string()
    .trim()
    .min(5, 'Phone required')
    .max(40)
    .regex(/^[\d+\s()-]+$/, 'Invalid phone format'),
  email: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  zone: z.enum(['diani-strip', 'south-coast', 'mombasa', 'further']),
  deliveryDate: z.string().min(1, 'Delivery date required').max(40),
  address: z.string().trim().min(3, 'Address required').max(1000),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

const cartLineSchema = z.object({
  productId: z.number().int().positive(),
  qty: z.number().int().min(1).max(50),
  variantSize: z.string().max(80).optional().nullable(),
  variantColor: z.string().max(80).optional().nullable(),
});

function buildCartError(slug: string, msg: string): never {
  redirect(
    `/shop/${slug}/cart?error=${encodeURIComponent(msg)}`,
  );
}

export async function placeCartOrderForm(
  slug: string,
  formData: FormData,
): Promise<void> {
  const raw = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    zone: formData.get('zone'),
    deliveryDate: formData.get('deliveryDate'),
    address: formData.get('address'),
    notes: formData.get('notes'),
  };
  const parsed = cartSchema.safeParse(raw);
  if (!parsed.success) {
    buildCartError(slug, parsed.error.issues[0]?.message ?? 'Invalid form');
  }
  const data = parsed.data!;

  // Parse cart
  const cartRaw = String(formData.get('cart') ?? '');
  let cart: CartLine[];
  try {
    const arr = JSON.parse(cartRaw);
    if (!Array.isArray(arr)) throw new Error('cart not an array');
    cart = arr.map((line, i) => {
      const p = cartLineSchema.safeParse(line);
      if (!p.success) throw new Error(`line ${i}: ${p.error.issues[0]?.message}`);
      return p.data;
    });
  } catch (e) {
    buildCartError(slug, `Invalid cart: ${(e as Error).message}`);
  }
  if (cart!.length === 0) {
    buildCartError(slug, 'Cart is empty');
  }

  // Load shop (dbSchema is imported above as an alias for drizzle schema)
  const [shopRow] = await db
    .select()
    .from(dbSchema.shops)
    .where(_and(_eq(dbSchema.shops.slug, slug), _eq(dbSchema.shops.status, 'live')))
    .limit(1);
  if (!shopRow) {
    buildCartError(slug, 'Shop not found');
  }

  const input: CreateCartOrderInput = {
    shop: shopRow!,
    lines: cart!,
    customerName: data.name,
    customerPhone: data.phone,
    customerEmail: data.email,
    deliveryZone: data.zone,
    deliveryAddress: data.address,
    deliveryDate: data.deliveryDate,
    deliveryTimeNote: null,
    newsletterOptin: false,
    notes: data.notes,
  };

  let created;
  try {
    created = await createOrderFromCart(input);
  } catch (e) {
    const msg = (e as Error).message || 'Order creation failed';
    console.error('[placeCartOrderForm]', msg);
    buildCartError(slug, msg);
  }

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/shops/${shopRow!.id}`);
  redirect(
    `/shop/${slug}/checkout/success?order=${encodeURIComponent(created!.orderNumber)}`,
  );
}
