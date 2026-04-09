/**
 * Standalone mockup preview page.
 *
 * Renders a shop's home in a full-bleed view using a mockup's layout +
 * design tokens instead of the shop's persisted ones. Used inside iframes
 * on the admin mockups page so the designer can visually compare 3
 * interpretations side by side before applying one.
 *
 * Route: /mockup-preview/[mockupId]
 *
 * Security: this page exposes only design data (no orders, no PII).
 * It requires an authenticated admin session.
 */

import { and, desc, eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';

import { db, schema } from '@/lib/db/client';
import { auth } from '@/lib/auth';
import { resolveLayout, resolveHomeComponent } from '@/lib/layout-registry';
import { getLatestRates } from '@/lib/currency';
import type { DesignTokens } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

const FALLBACK_TOKENS: DesignTokens = {
  primary: '#B8651A',
  secondary: '#2A3A28',
  accent: '#E8C547',
  font_display: 'Fraunces',
  font_body: 'Inter',
  radius: 'xl',
  hero_treatment: 'warm-overlay',
};

export default async function MockupPreviewPage({
  params,
}: {
  params: Promise<{ mockupId: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/admin/login');
  }

  const { mockupId: mockupIdParam } = await params;
  const mockupId = Number(mockupIdParam);
  if (!Number.isFinite(mockupId) || mockupId <= 0) notFound();

  const [mockup] = await db
    .select()
    .from(schema.shopMockups)
    .where(eq(schema.shopMockups.id, mockupId))
    .limit(1);
  if (!mockup) notFound();

  const [shop] = await db
    .select()
    .from(schema.shops)
    .where(eq(schema.shops.id, mockup.shopId))
    .limit(1);
  if (!shop) notFound();

  // Override the shop's persisted design with the mockup's
  const previewShop = {
    ...shop,
    layoutVariant: mockup.layoutVariant,
    designTokens: mockup.designTokens as DesignTokens,
    copyTone: mockup.copyTone,
    tagline: shop.tagline,
  };

  // Load top-5 products for this shop (same filter the live shop uses)
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

  const tokens: DesignTokens = previewShop.designTokens ?? FALLBACK_TOKENS;
  const LayoutComponent = resolveLayout(previewShop.layoutVariant);
  const HomeComponent = resolveHomeComponent(previewShop.layoutVariant);

  const fontQuery = [
    `family=${encodeURIComponent(tokens.font_display)}:wght@400;600;700`,
    `family=${encodeURIComponent(tokens.font_body)}:wght@300;400;500;600`,
  ].join('&');
  const fontHref = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" href={fontHref} />

      {/* Subtle banner so the admin knows this is a preview, not the real shop */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(0,0,0,0.85)',
          color: '#fff',
          padding: '6px 16px',
          fontSize: '11px',
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        Mockup Preview · {mockup.name} · variant {mockup.variantIndex}
      </div>

      <LayoutComponent
        shop={previewShop}
        products={products}
        tokens={tokens}
        rates={rates}
      >
        <HomeComponent
          shop={previewShop}
          products={products}
          rates={rates}
        />
      </LayoutComponent>
    </>
  );
}

export const metadata = {
  title: 'Mockup Preview',
  description: 'Admin preview of a shop design mockup',
  robots: 'noindex, nofollow',
};
