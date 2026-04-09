import Link from 'next/link';
import type { ShopLayoutProps } from './types';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Badge } from '@/components/ui/Badge';

/**
 * HeritageStory — full-width hero photo, cream background with deep forest
 * accents, Playfair Display + Inter. Asymmetric editorial layout with
 * narrative blocks between products and pullquotes from about_purpose.
 */
export function HeritageStory({ shop, products, tokens, rates, children }: ShopLayoutProps) {
  const cssVars = {
    '--mt-primary': tokens.primary,
    '--mt-secondary': tokens.secondary,
    '--mt-accent': tokens.accent,
    '--mt-font-display': `'${tokens.font_display}', serif`,
    '--mt-font-body': `'${tokens.font_body}', sans-serif`,
  } as React.CSSProperties;

  const heroPhoto = shop.aboutPhotoUrl ?? products[0]?.photos?.[0];

  return (
    <div
      style={cssVars}
      className="min-h-screen bg-[#F5F0E6] text-[#1F2A1F] font-[var(--mt-font-body)]"
    >
      {/* Header — thin bar over hero */}
      <header className="absolute top-0 inset-x-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between text-white">
          <Link href={`/shop/${shop.slug}`}>
            <h1 className="font-[var(--mt-font-display)] text-2xl font-bold drop-shadow-md">
              {shop.title}
            </h1>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href={`/shop/${shop.slug}`} className="hover:opacity-80 drop-shadow">
              Home
            </Link>
            <Link
              href={`/shop/${shop.slug}/about`}
              className="hover:opacity-80 drop-shadow"
            >
              About
            </Link>
            <Link
              href={`/shop/${shop.slug}/checkout`}
              className="hover:opacity-80 drop-shadow"
            >
              Cart
            </Link>
          </nav>
        </div>
      </header>

      {/* Full-bleed hero photo */}
      <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroPhoto} alt={shop.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#2A3A28] to-[#4A5A3E]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />
        <div className="absolute inset-x-0 bottom-0 p-8 md:p-16 max-w-4xl text-white">
          <p className="text-xs uppercase tracking-[0.3em] mb-4 text-[var(--mt-accent)]">
            Est. Diani Beach, Kenya
          </p>
          <h2 className="font-[var(--mt-font-display)] text-4xl md:text-6xl font-bold leading-tight mb-4">
            {shop.tagline ?? shop.title}
          </h2>
          {shop.aboutOffering && (
            <p className="text-lg md:text-xl max-w-2xl opacity-95">{shop.aboutOffering}</p>
          )}
        </div>
      </section>

      {/* Main */}
      <main>
        {children ?? <HeritageHome shop={shop} products={products} rates={rates} />}
      </main>

      {/* Footer */}
      <footer className="bg-[#2A3A28] text-white/80">
        <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-[var(--mt-font-display)] text-xl text-white mb-2">
              {shop.title}
            </h4>
            <p className="text-sm">Diani Beach, Kenya</p>
          </div>
          <div className="text-sm">
            <p className="uppercase tracking-wider text-xs mb-2 text-[var(--mt-accent)]">
              Heritage
            </p>
            <p className="line-clamp-3">{shop.aboutPurpose}</p>
          </div>
          <div className="text-xs text-white/50 md:text-right">
            Powered by MaybeTomorrow.store
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeritageHome({
  shop,
  products,
  rates,
}: Pick<ShopLayoutProps, 'shop' | 'products' | 'rates'>) {
  const firstPair = products.slice(0, 2);
  const pullquote = shop.aboutPurpose?.split('.')[0];
  const remaining = products.slice(2);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 space-y-20">
      {/* Intro row: headline + first 2 products asymmetric */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5 md:pt-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--mt-primary)] mb-4">
            Chapter One
          </p>
          <h3 className="font-[var(--mt-font-display)] text-4xl leading-tight text-[#1F2A1F] mb-6">
            A slow story from the coast
          </h3>
          <p className="text-[#4A4A3E] leading-relaxed mb-6">
            {shop.aboutOffering ??
              'Each piece carries the patience of the tide and the warmth of the hands that made it.'}
          </p>
          <Link
            href={`/shop/${shop.slug}/about`}
            className="inline-block border-b-2 border-[var(--mt-primary)] pb-1 text-[var(--mt-primary)] font-semibold hover:opacity-70"
          >
            Read the full story
          </Link>
        </div>
        <div className="md:col-span-7 grid grid-cols-2 gap-6">
          {firstPair.map((p) => (
            <HeritageCard key={p.id} shop={shop} product={p} rates={rates} />
          ))}
        </div>
      </section>

      {/* Pull quote */}
      {pullquote && (
        <section className="border-y-2 border-[#2A3A28] py-12 text-center max-w-4xl mx-auto">
          <blockquote className="font-[var(--mt-font-display)] text-2xl md:text-3xl italic leading-snug text-[#2A3A28]">
            “{pullquote}.”
          </blockquote>
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-[var(--mt-primary)]">
            {shop.aboutName ?? 'The maker'}
          </p>
        </section>
      )}

      {/* Remaining products */}
      {remaining.length > 0 && (
        <section>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--mt-primary)] mb-6">
            Chapter Two — The selection
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {remaining.map((p) => (
              <HeritageCard key={p.id} shop={shop} product={p} rates={rates} />
            ))}
          </div>
        </section>
      )}

      {products.length === 0 && (
        <p className="text-center text-[#4A4A3E] italic py-16">New chapters arriving soon.</p>
      )}
    </div>
  );
}

function HeritageCard({
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
      <div className="relative aspect-[4/5] overflow-hidden bg-[#E8DFC8] mb-4">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#4A4A3E] text-sm">
            No photo
          </div>
        )}
        {product.discountPct > 0 && (
          <div className="absolute top-3 left-3">
            <Badge variant="discount">-{product.discountPct}%</Badge>
          </div>
        )}
      </div>
      <h4 className="font-[var(--mt-font-display)] text-xl text-[#1F2A1F] mb-2 group-hover:text-[var(--mt-primary)] transition-colors">
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
