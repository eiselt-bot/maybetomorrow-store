import type { ReactNode } from 'react';
import { loadShop } from './_loaders';
import { resolveLayout } from '@/lib/layout-registry';
import type { DesignTokens } from '@/lib/db/schema';

/**
 * Default design tokens used when a shop has no `design_tokens` configured.
 * Keeps the app from crashing on partially-seeded data.
 */
const FALLBACK_TOKENS: DesignTokens = {
  primary: '#B8651A',
  secondary: '#2A3A28',
  accent: '#E8C547',
  font_display: 'Fraunces',
  font_body: 'Inter',
  radius: 'xl',
  hero_treatment: 'warm-overlay',
};

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

/**
 * Shop-scoped layout (server component).
 * 1. Loads shop + top-5 + rates (cached / deduped with page.tsx)
 * 2. Injects Google Fonts link for display + body fonts
 * 3. Picks the right layout component from the registry
 * 4. Wraps `children` inside that layout (layout handles header/hero/footer)
 */
export default async function ShopLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const { shop, products, rates } = await loadShop(slug);

  const tokens: DesignTokens = shop.designTokens ?? FALLBACK_TOKENS;
  const LayoutComponent = resolveLayout(shop.layoutVariant);

  const fontQuery = [
    `family=${encodeURIComponent(tokens.font_display)}:wght@400;600;700`,
    `family=${encodeURIComponent(tokens.font_body)}:wght@300;400;500;600`,
  ].join('&');
  const fontHref = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`;

  return (
    <>
      {/* Dynamic Google Fonts — Next.js hoists <link> into <head> */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={fontHref} />

      <LayoutComponent shop={shop} products={products} tokens={tokens} rates={rates}>
        {children}
      </LayoutComponent>
    </>
  );
}

/** Per-shop metadata (title + description) */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const { shop } = await loadShop(slug);
    return {
      title: `${shop.title} — MaybeTomorrow.store`,
      description: shop.tagline ?? shop.aboutOffering ?? 'Handmade in Diani, Kenya',
    };
  } catch {
    return { title: 'Shop — MaybeTomorrow.store' };
  }
}
