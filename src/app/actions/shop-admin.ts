'use server';

/**
 * Server Actions for admin shop management.
 *
 * All mutations revalidate the relevant /admin/shops/[id] paths so the
 * Server Components reflect changes immediately after form submission.
 *
 * Auth: every action calls requireAdmin() which checks the NextAuth session.
 * Validation: every payload is parsed with Zod — invalid input throws.
 */

import { db, schema } from '@/lib/db/client';
import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { z } from 'zod';

// ============================================================================
// Auth guard
// ============================================================================

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

// ============================================================================
// Zod schemas
// ============================================================================

const layoutVariantSchema = z.enum([
  'earthy-artisan',
  'vibrant-market',
  'ocean-calm',
  'heritage-story',
  'bold-maker',
]);

const shopStatusSchema = z.enum(['draft', 'live', 'paused', 'archived']);
const productStatusSchema = z.enum(['active', 'archived']);

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{3,8}$/, 'Must be a hex color like #c87a1f');

const designTokensSchema = z.object({
  primary: hexColor,
  secondary: hexColor,
  accent: hexColor,
  font_display: z.string().min(1).max(80),
  font_body: z.string().min(1).max(80),
  radius: z.enum(['none', 'sm', 'md', 'lg', 'xl']),
  hero_treatment: z.enum([
    'warm-overlay',
    'cool-overlay',
    'polaroid',
    'clean',
    'pattern-bg',
  ]),
});

const aboutSchema = z.object({
  aboutName: z.string().max(200).nullable().optional(),
  aboutOffering: z.string().max(2000).nullable().optional(),
  aboutPurpose: z.string().max(2000).nullable().optional(),
  aboutProduction: z.string().max(2000).nullable().optional(),
  aboutPhotoUrl: z.string().max(500).nullable().optional(),
});

const settingsSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, dashes only'),
  title: z.string().min(1).max(200),
  tagline: z.string().max(300).nullable().optional(),
  vendorPhone: z.string().min(5).max(40),
  vendorMpesaNumber: z.string().max(40).nullable().optional(),
  status: shopStatusSchema,
});

const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(3000).nullable().optional(),
  productionInfo: z.string().max(2000).nullable().optional(),
  priceKes: z.coerce.number().int().min(0).max(10_000_000),
  deliveryDays: z.coerce.number().int().min(0).max(365).default(1),
  discountPct: z.coerce.number().int().min(0).max(100).default(0),
  isTop5: z.boolean().default(false),
  photos: z.array(z.string().max(500)).max(3).default([]),
  status: productStatusSchema.default('active'),
});

const brandValuesSchema = z
  .array(z.string().max(200))
  .min(1)
  .max(5);

// ============================================================================
// Helpers
// ============================================================================

function nullIfEmpty(v: string | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

function shopPath(shopId: number, sub?: string): string {
  const base = `/admin/shops/${shopId}`;
  return sub ? `${base}/${sub}` : base;
}

function revalidateShop(shopId: number) {
  revalidatePath(shopPath(shopId));
  revalidatePath(shopPath(shopId, 'brand-values'));
  revalidatePath(shopPath(shopId, 'template'));
  revalidatePath(shopPath(shopId, 'products'));
  revalidatePath('/admin/shops');
}

// ============================================================================
// Shop: About
// ============================================================================

export async function updateShopAbout(
  shopId: number,
  data: z.input<typeof aboutSchema>,
) {
  await requireAdmin();
  const parsed = aboutSchema.parse(data);

  await db
    .update(schema.shops)
    .set({
      aboutName: nullIfEmpty(parsed.aboutName ?? null),
      aboutOffering: nullIfEmpty(parsed.aboutOffering ?? null),
      aboutPurpose: nullIfEmpty(parsed.aboutPurpose ?? null),
      aboutProduction: nullIfEmpty(parsed.aboutProduction ?? null),
      aboutPhotoUrl: nullIfEmpty(parsed.aboutPhotoUrl ?? null),
      updatedAt: new Date(),
    })
    .where(eq(schema.shops.id, shopId));

  revalidateShop(shopId);
  return { ok: true as const };
}

// ============================================================================
// Shop: Brand Values
// ============================================================================

export async function updateBrandValues(shopId: number, values: string[]) {
  await requireAdmin();
  // Trim, drop empties, cap at 5
  const cleaned = values
    .map((v) => (v ?? '').trim())
    .filter((v) => v.length > 0)
    .slice(0, 5);
  const parsed = brandValuesSchema.parse(cleaned);

  await db
    .update(schema.shops)
    .set({ brandValues: parsed, updatedAt: new Date() })
    .where(eq(schema.shops.id, shopId));

  revalidateShop(shopId);
  return { ok: true as const, values: parsed };
}

// ============================================================================
// Shop: Layout Variant
// ============================================================================

export async function updateLayoutVariant(shopId: number, variant: string) {
  await requireAdmin();
  const parsed = layoutVariantSchema.parse(variant);

  await db
    .update(schema.shops)
    .set({ layoutVariant: parsed, updatedAt: new Date() })
    .where(eq(schema.shops.id, shopId));

  revalidateShop(shopId);
  return { ok: true as const, variant: parsed };
}

// ============================================================================
// Shop: Design Tokens
// ============================================================================

export async function updateDesignTokens(
  shopId: number,
  tokens: z.input<typeof designTokensSchema>,
) {
  await requireAdmin();
  const parsed = designTokensSchema.parse(tokens);

  await db
    .update(schema.shops)
    .set({ designTokens: parsed, updatedAt: new Date() })
    .where(eq(schema.shops.id, shopId));

  revalidateShop(shopId);
  return { ok: true as const };
}

// ============================================================================
// Shop: Settings (slug, status, phones, mpesa)
// ============================================================================

export async function updateShopSettings(
  shopId: number,
  data: z.input<typeof settingsSchema>,
) {
  await requireAdmin();
  const parsed = settingsSchema.parse(data);

  await db
    .update(schema.shops)
    .set({
      slug: parsed.slug,
      title: parsed.title,
      tagline: nullIfEmpty(parsed.tagline ?? null),
      vendorPhone: parsed.vendorPhone,
      vendorMpesaNumber: nullIfEmpty(parsed.vendorMpesaNumber ?? null),
      status: parsed.status,
      updatedAt: new Date(),
    })
    .where(eq(schema.shops.id, shopId));

  revalidateShop(shopId);
  return { ok: true as const };
}

export async function updateShopStatus(shopId: number, status: string) {
  await requireAdmin();
  const parsed = shopStatusSchema.parse(status);

  await db
    .update(schema.shops)
    .set({ status: parsed, updatedAt: new Date() })
    .where(eq(schema.shops.id, shopId));

  revalidateShop(shopId);
  return { ok: true as const };
}

// ============================================================================
// Products
// ============================================================================

export async function createProduct(
  shopId: number,
  data: z.input<typeof productSchema>,
) {
  await requireAdmin();
  const parsed = productSchema.parse(data);

  const [row] = await db
    .insert(schema.products)
    .values({
      shopId,
      name: parsed.name,
      description: nullIfEmpty(parsed.description ?? null),
      productionInfo: nullIfEmpty(parsed.productionInfo ?? null),
      priceKes: parsed.priceKes,
      deliveryDays: parsed.deliveryDays,
      discountPct: parsed.discountPct,
      isTop5: parsed.isTop5,
      photos: parsed.photos.filter((p) => p.trim().length > 0),
      status: parsed.status,
    })
    .returning({ id: schema.products.id });

  revalidateShop(shopId);
  return { ok: true as const, productId: row?.id };
}

export async function updateProduct(
  productId: number,
  data: z.input<typeof productSchema>,
) {
  await requireAdmin();
  const parsed = productSchema.parse(data);

  const [existing] = await db
    .select({ shopId: schema.products.shopId })
    .from(schema.products)
    .where(eq(schema.products.id, productId))
    .limit(1);

  if (!existing) throw new Error('PRODUCT_NOT_FOUND');

  await db
    .update(schema.products)
    .set({
      name: parsed.name,
      description: nullIfEmpty(parsed.description ?? null),
      productionInfo: nullIfEmpty(parsed.productionInfo ?? null),
      priceKes: parsed.priceKes,
      deliveryDays: parsed.deliveryDays,
      discountPct: parsed.discountPct,
      isTop5: parsed.isTop5,
      photos: parsed.photos.filter((p) => p.trim().length > 0),
      status: parsed.status,
    })
    .where(eq(schema.products.id, productId));

  revalidateShop(existing.shopId);
  return { ok: true as const };
}

export async function deleteProduct(productId: number) {
  await requireAdmin();

  const [existing] = await db
    .select({ shopId: schema.products.shopId })
    .from(schema.products)
    .where(eq(schema.products.id, productId))
    .limit(1);

  if (!existing) throw new Error('PRODUCT_NOT_FOUND');

  await db.delete(schema.products).where(eq(schema.products.id, productId));

  revalidateShop(existing.shopId);
  return { ok: true as const };
}

export async function toggleProductTop5(productId: number) {
  await requireAdmin();

  const [existing] = await db
    .select({
      shopId: schema.products.shopId,
      isTop5: schema.products.isTop5,
    })
    .from(schema.products)
    .where(eq(schema.products.id, productId))
    .limit(1);

  if (!existing) throw new Error('PRODUCT_NOT_FOUND');

  await db
    .update(schema.products)
    .set({ isTop5: !existing.isTop5 })
    .where(eq(schema.products.id, productId));

  revalidateShop(existing.shopId);
  return { ok: true as const, isTop5: !existing.isTop5 };
}

export async function updateProductDiscount(
  productId: number,
  discountPct: number,
) {
  await requireAdmin();
  const parsed = z.coerce.number().int().min(0).max(100).parse(discountPct);

  const [existing] = await db
    .select({ shopId: schema.products.shopId })
    .from(schema.products)
    .where(eq(schema.products.id, productId))
    .limit(1);

  if (!existing) throw new Error('PRODUCT_NOT_FOUND');

  await db
    .update(schema.products)
    .set({ discountPct: parsed })
    .where(eq(schema.products.id, productId));

  revalidateShop(existing.shopId);
  return { ok: true as const };
}

// ============================================================================
// Form-action wrappers
//
// These accept FormData directly so they can be bound to <form action={...}>
// without a client component. Each wraps the corresponding typed action.
// ============================================================================

export async function updateShopAboutForm(shopId: number, formData: FormData) {
  await updateShopAbout(shopId, {
    aboutName: (formData.get('aboutName') as string) || null,
    aboutOffering: (formData.get('aboutOffering') as string) || null,
    aboutPurpose: (formData.get('aboutPurpose') as string) || null,
    aboutProduction: (formData.get('aboutProduction') as string) || null,
    aboutPhotoUrl: (formData.get('aboutPhotoUrl') as string) || null,
  });
}

export async function updateBrandValuesForm(
  shopId: number,
  formData: FormData,
) {
  const values: string[] = [];
  for (let i = 0; i < 5; i++) {
    values.push(((formData.get(`value_${i}`) as string) || '').trim());
  }
  await updateBrandValues(shopId, values);
}

export async function updateLayoutVariantForm(
  shopId: number,
  formData: FormData,
) {
  const variant = formData.get('layoutVariant') as string;
  await updateLayoutVariant(shopId, variant);
}

export async function updateDesignTokensForm(
  shopId: number,
  formData: FormData,
) {
  await updateDesignTokens(shopId, {
    primary: (formData.get('primary') as string) || '#c87a1f',
    secondary: (formData.get('secondary') as string) || '#0f7080',
    accent: (formData.get('accent') as string) || '#d99543',
    font_display: (formData.get('font_display') as string) || 'Fraunces',
    font_body: (formData.get('font_body') as string) || 'Inter',
    radius:
      (formData.get('radius') as
        | 'none'
        | 'sm'
        | 'md'
        | 'lg'
        | 'xl') || 'md',
    hero_treatment:
      (formData.get('hero_treatment') as
        | 'warm-overlay'
        | 'cool-overlay'
        | 'polaroid'
        | 'clean'
        | 'pattern-bg') || 'warm-overlay',
  });
}

export async function updateShopSettingsForm(
  shopId: number,
  formData: FormData,
) {
  await updateShopSettings(shopId, {
    slug: formData.get('slug') as string,
    title: formData.get('title') as string,
    tagline: (formData.get('tagline') as string) || null,
    vendorPhone: formData.get('vendorPhone') as string,
    vendorMpesaNumber: (formData.get('vendorMpesaNumber') as string) || null,
    status: formData.get('status') as
      | 'draft'
      | 'live'
      | 'paused'
      | 'archived',
  });
}

function productDataFromForm(formData: FormData): z.input<typeof productSchema> {
  const photos: string[] = [];
  for (let i = 0; i < 3; i++) {
    const p = (formData.get(`photo_${i}`) as string) || '';
    if (p.trim().length > 0) photos.push(p.trim());
  }
  return {
    name: (formData.get('name') as string) || '',
    description: (formData.get('description') as string) || null,
    productionInfo: (formData.get('productionInfo') as string) || null,
    priceKes: Number(formData.get('priceKes') || 0),
    deliveryDays: Number(formData.get('deliveryDays') || 1),
    discountPct: Number(formData.get('discountPct') || 0),
    isTop5: formData.get('isTop5') === 'on',
    photos,
    status:
      (formData.get('status') as 'active' | 'archived') || 'active',
  };
}

export async function createProductForm(shopId: number, formData: FormData) {
  await createProduct(shopId, productDataFromForm(formData));
  redirect(`/admin/shops/${shopId}/products`);
}

export async function updateProductForm(
  shopId: number,
  productId: number,
  formData: FormData,
) {
  await updateProduct(productId, productDataFromForm(formData));
  redirect(`/admin/shops/${shopId}/products`);
}

export async function deleteProductForm(
  shopId: number,
  productId: number,
) {
  await deleteProduct(productId);
  revalidatePath(`/admin/shops/${shopId}/products`);
}

export async function toggleProductTop5Form(
  shopId: number,
  productId: number,
) {
  await toggleProductTop5(productId);
  revalidatePath(`/admin/shops/${shopId}/products`);
  revalidatePath(`/admin/shops/${shopId}`);
}

export async function updateProductDiscountForm(
  shopId: number,
  productId: number,
  formData: FormData,
) {
  const pct = Number(formData.get('discountPct') || 0);
  await updateProductDiscount(productId, pct);
  revalidatePath(`/admin/shops/${shopId}/products`);
}


// ============================================================================
// Mockup generation + application (CR: Shop Design Management)
// ============================================================================

import { generateMockups } from '@/lib/services/mockup-generator';

/**
 * Form-action wrapper: called from brand-values / template / mockups pages.
 * Generates 3 fresh mockups via Claude, stores them as 'pending', and
 * redirects the admin to the mockups review page.
 *
 * Previous pending mockups for this shop are marked 'rejected' first.
 */
export async function generateMockupsForm(
  shopId: number,
  _formData: FormData,
): Promise<void> {
  await requireAdmin();

  const [shop] = await db
    .select()
    .from(schema.shops)
    .where(eq(schema.shops.id, shopId))
    .limit(1);
  if (!shop) {
    redirect(`/admin/shops/${shopId}/mockups?error=Shop+not+found`);
  }

  const brandValues = (shop.brandValues ?? []).filter(
    (v) => typeof v === 'string' && v.trim().length > 0,
  );
  if (brandValues.length === 0) {
    redirect(
      `/admin/shops/${shopId}/mockups?error=${encodeURIComponent(
        'Please set at least one brand value before generating mockups.',
      )}`,
    );
  }

  let variants;
  try {
    variants = await generateMockups(shop, brandValues);
  } catch (e) {
    const msg = (e as Error).message || 'Generation failed';
    console.error('[generateMockupsForm]', msg);
    redirect(
      `/admin/shops/${shopId}/mockups?error=${encodeURIComponent(msg)}`,
    );
  }

  // Supersede any still-pending mockups from a previous generation
  await db
    .update(schema.shopMockups)
    .set({ status: 'rejected' })
    .where(
      and(
        eq(schema.shopMockups.shopId, shopId),
        eq(schema.shopMockups.status, 'pending'),
      ),
    );

  await db.insert(schema.shopMockups).values(
    variants.map((v, i) => ({
      shopId,
      variantIndex: i + 1,
      name: v.name,
      rationale: v.rationale,
      layoutVariant: v.layout_variant,
      designTokens: v.design_tokens,
      copyTone: v.copy_tone,
      brandValuesSnapshot: brandValues,
    })),
  );

  revalidatePath(`/admin/shops/${shopId}`);
  revalidatePath(`/admin/shops/${shopId}/mockups`);
  redirect(`/admin/shops/${shopId}/mockups`);
}

/**
 * Form-action wrapper: applies a specific mockup's design to the shop.
 * Marks the chosen mockup 'selected' and any siblings 'rejected'.
 */
export async function applyMockupForm(
  shopId: number,
  mockupId: number,
  _formData: FormData,
): Promise<void> {
  await requireAdmin();

  const [mockup] = await db
    .select()
    .from(schema.shopMockups)
    .where(
      and(
        eq(schema.shopMockups.id, mockupId),
        eq(schema.shopMockups.shopId, shopId),
      ),
    )
    .limit(1);
  if (!mockup) {
    redirect(`/admin/shops/${shopId}/mockups?error=Mockup+not+found`);
  }

  await db
    .update(schema.shops)
    .set({
      layoutVariant: mockup.layoutVariant,
      designTokens: mockup.designTokens,
      copyTone: mockup.copyTone,
      updatedAt: new Date(),
    })
    .where(eq(schema.shops.id, shopId));

  // Mark siblings rejected, chosen selected
  await db
    .update(schema.shopMockups)
    .set({ status: 'rejected' })
    .where(
      and(
        eq(schema.shopMockups.shopId, shopId),
        eq(schema.shopMockups.status, 'pending'),
      ),
    );
  await db
    .update(schema.shopMockups)
    .set({ status: 'selected' })
    .where(eq(schema.shopMockups.id, mockupId));

  revalidatePath(`/admin/shops/${shopId}`);
  revalidatePath(`/admin/shops/${shopId}/mockups`);
  revalidatePath(`/admin/shops/${shopId}/template`);
  revalidatePath(`/shop/${mockup.shopId}`);
  redirect(`/admin/shops/${shopId}?applied=${mockupId}`);
}
