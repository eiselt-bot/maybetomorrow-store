import Link from 'next/link';
import type { ShopLayoutProps } from './types';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

/**
 * EarthyArtisan — slow, generous whitespace, warm ochre primary,
 * cream background, story-first vertical rhythm. Think Aesop x artisan boutique.
 */
export function EarthyArtisan({ shop, products, tokens, rates, children }: ShopLayoutProps) {
  const cssVars = {
    '--mt-primary': tokens.primary,
    '--mt-secondary': tokens.secondary,
    '--mt-accent': tokens.accent,
    '--mt-font-display': `'${tokens.font_display}', serif`,
    '--mt-font-body': `'${tokens.font_body}', sans-serif`,
  } as React.CSSProperties;

  return (
    <div
      style={cssVars}
      className="min-h-screen bg-[#FAF6EF] text-stone-800 font-[var(--mt-font-body)]"
    >
      {/* Header */}
      <header className="border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href={`/shop/${shop.slug}`} className="group">
            <h1 className="font-[var(--mt-font-display)] text-2xl tracking-wide text-stone-900 group-hover:text-[var(--mt-primary)] transition-colors">
              {shop.title}
            </h1>
          </Link>
          <nav className="flex items-center gap-8 text-sm tracking-wide uppercase text-stone-600">
            <Link href={`/shop/${shop.slug}`} className="hover:text-[var(--mt-primary)]">
              Home
            </Link>
            <Link href={`/shop/${shop.slug}/about`} className="hover:text-[var(--mt-primary)]">
              About
            </Link>
            <Link
              href={`/shop/${shop.slug}/checkout`}
              className="hover:text-[var(--mt-primary)]"
            >
              Cart
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <p className="uppercase tracking-[0.3em] text-xs text-[var(--mt-primary)] mb-6">
            Handmade in Diani, Kenya
          </p>
          <h2 className="font-[var(--mt-font-display)] text-5xl md:text-6xl leading-[1.1] text-stone-900 mb-6">
            {shop.tagline ?? shop.title}
          </h2>
          {shop.aboutOffering && (
            <p className="max-w-2xl mx-auto text-lg leading-relaxed text-stone-600">
              {shop.aboutOffering}
            </p>
          )}
        </div>
      </section>

      {/* Main / children slot */}
      <main className="max-w-5xl mx-auto px-6 pb-24">
        {children ?? <EarthyHome shop={shop} products={products} rates={rates} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-[#F2ECE0]">
        <div className="max-w-5xl mx-auto px-6 py-12 text-center text-sm text-stone-600">
          <p className="font-[var(--mt-font-display)] text-lg text-stone-900 mb-2">
            {shop.title}
          </p>
          <p>Diani Beach, Kenya · Delivered with care</p>
          <p className="mt-4 text-xs opacity-60">Powered by MaybeTomorrow.store</p>
        </div>
      </footer>
    </div>
  );
}

function EarthyHome({
  shop,
  products,
  rates,
}: Pick<ShopLayoutProps, 'shop' | 'products' | 'rates'>) {
  return (
    <div className="space-y-24">
      {/* Top 5 Product Grid */}
      <section>
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-[var(--mt-primary)] mb-2">
              Our Selection
            </p>
            <h3 className="font-[var(--mt-font-display)] text-3xl text-stone-900">
              A quiet shelf of favourites
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {products.map((p) => (
            <EarthyProductCard key={p.id} shop={shop} product={p} rates={rates} />
          ))}
          {products.length === 0 && (
            <p className="text-stone-500 italic col-span-full text-center py-16">
              New pieces arriving soon.
            </p>
          )}
        </div>
      </section>

      {/* About Teaser */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {shop.aboutPhotoUrl && (
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shop.aboutPhotoUrl}
              alt={shop.aboutName ?? shop.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-amber-900/30 via-transparent to-transparent" />
          </div>
        )}
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--mt-primary)] mb-3">
            Our story
          </p>
          <h3 className="font-[var(--mt-font-display)] text-3xl text-stone-900 mb-5">
            {shop.aboutName ?? 'Made by hand'}
          </h3>
          <p className="text-stone-600 leading-relaxed mb-6 line-clamp-4">
            {shop.aboutPurpose ?? shop.aboutOffering ?? 'Crafted with patience on the coast.'}
          </p>
          <Link
            href={`/shop/${shop.slug}/about`}
            className="inline-block text-[var(--mt-primary)] underline underline-offset-4 hover:opacity-70"
          >
            Read more →
          </Link>
        </div>
      </section>
    </div>
  );
}

function EarthyProductCard({
  shop,
  product,
  rates,
}: {
  shop: ShopLayoutProps['shop'];
  product: ShopLayoutProps['products'][number];
  rates: ShopLayoutProps['rates'];
}) {
  const photo = product.photos?.[0];
  return (
    <Link href={`/shop/${shop.slug}/product/${product.id}`} className="group block">
      <div
        className={cn(
          'relative aspect-[4/5] overflow-hidden rounded-xl bg-stone-200 mb-5',
        )}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm">
            No photo
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 via-transparent to-transparent" />
        {product.discountPct > 0 && (
          <div className="absolute top-3 right-3">
            <Badge variant="discount">-{product.discountPct}%</Badge>
          </div>
        )}
      </div>
      <h4 className="font-[var(--mt-font-display)] text-xl text-stone-900 mb-2 group-hover:text-[var(--mt-primary)] transition-colors">
        {product.name}
      </h4>
      <PriceDisplay
        priceKes={product.priceKes}
        discountPct={product.discountPct}
        rates={rates}
        compact
      />
    </Link>
  );
}
