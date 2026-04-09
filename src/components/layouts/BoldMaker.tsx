import Link from 'next/link';
import type { ShopLayoutProps } from './types';
import { PriceDisplay } from '@/components/ui/PriceDisplay';

/**
 * BoldMaker — brutalist. Thick black borders, giant type, no rounding,
 * hard-edged photo frames, asymmetric grid, black-on-coral badges.
 * Outfit display + DM Mono body.
 */
export function BoldMaker({ shop, products, tokens, rates, children }: ShopLayoutProps) {
  const cssVars = {
    '--mt-primary': tokens.primary,
    '--mt-secondary': tokens.secondary,
    '--mt-accent': tokens.accent,
    '--mt-font-display': `'${tokens.font_display}', sans-serif`,
    '--mt-font-body': `'${tokens.font_body}', monospace`,
  } as React.CSSProperties;

  return (
    <div
      style={cssVars}
      className="min-h-screen bg-[#FAFAF7] text-black font-[var(--mt-font-body)]"
    >
      {/* Header — thick black border */}
      <header className="border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={`/shop/${shop.slug}`}>
            <h1 className="font-[var(--mt-font-display)] text-3xl font-black uppercase tracking-tighter">
              {shop.title}
            </h1>
          </Link>
          <nav className="flex items-center gap-1 text-xs uppercase tracking-widest font-bold">
            <Link
              href={`/shop/${shop.slug}`}
              className="px-4 py-2 border-2 border-black hover:bg-black hover:text-white"
            >
              Home
            </Link>
            <Link
              href={`/shop/${shop.slug}/about`}
              className="px-4 py-2 border-2 border-black border-l-0 hover:bg-black hover:text-white"
            >
              About
            </Link>
            <Link
              href={`/shop/${shop.slug}/checkout`}
              className="px-4 py-2 border-2 border-black border-l-0 bg-[var(--mt-accent)] hover:bg-black hover:text-white"
            >
              Cart
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero — giant brutalist type */}
      <section className="border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-8">
            <p className="text-xs uppercase tracking-[0.3em] font-bold mb-4">
              [ Maker / Diani / 2025 ]
            </p>
            <h2 className="font-[var(--mt-font-display)] text-6xl md:text-8xl font-black uppercase leading-[0.85] tracking-tighter">
              {shop.tagline ?? shop.title}
            </h2>
          </div>
          {shop.aboutOffering && (
            <div className="md:col-span-4 border-l-4 border-black pl-6">
              <p className="text-sm leading-relaxed uppercase">{shop.aboutOffering}</p>
            </div>
          )}
        </div>
      </section>

      {/* Main */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-black text-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-wrap gap-4 justify-between items-center">
          <div>
            <p className="font-[var(--mt-font-display)] text-2xl font-black uppercase">
              {shop.title}
            </p>
            <p className="text-xs mt-1 opacity-70">DIANI / KENYA / MADE BY HAND</p>
          </div>
          <p className="text-xs opacity-50">[ MAYBETOMORROW.STORE ]</p>
        </div>
      </footer>
    </div>
  );
}

export function BoldHome({
  shop,
  products,
  rates,
}: Pick<ShopLayoutProps, 'shop' | 'products' | 'rates'>) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16 space-y-16">
      {/* Asymmetric product grid */}
      <section>
        <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-8">
          <h3 className="font-[var(--mt-font-display)] text-3xl md:text-4xl font-black uppercase tracking-tighter">
            The / Works
          </h3>
          <span className="text-xs font-bold uppercase">[{products.length.toString().padStart(2, '0')} pieces]</span>
        </div>

        {/* Asymmetric: first is big, rest is 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {products[0] && (
            <div className="md:col-span-7">
              <BoldCard shop={shop} product={products[0]} rates={rates} big />
            </div>
          )}
          <div className="md:col-span-5 grid grid-cols-2 gap-6 content-start">
            {products.slice(1).map((p) => (
              <BoldCard key={p.id} shop={shop} product={p} rates={rates} />
            ))}
          </div>
        </div>

        {products.length === 0 && (
          <p className="text-center py-16 text-sm uppercase tracking-widest">
            [ nothing on the bench ]
          </p>
        )}
      </section>

      {/* About teaser — brutalist block */}
      <section className="border-4 border-black p-6 md:p-10 grid md:grid-cols-[auto,1fr] gap-8 items-center">
        {shop.aboutPhotoUrl && (
          <div className="border-4 border-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shop.aboutPhotoUrl}
              alt={shop.aboutName ?? shop.title}
              className="w-40 h-40 md:w-56 md:h-56 object-cover block"
            />
          </div>
        )}
        <div>
          <p className="text-xs uppercase tracking-[0.3em] font-bold mb-2">[ The / Maker ]</p>
          <h4 className="font-[var(--mt-font-display)] text-3xl md:text-4xl font-black uppercase leading-none mb-4">
            {shop.aboutName ?? shop.title}
          </h4>
          <p className="text-sm leading-relaxed uppercase mb-5 line-clamp-4">
            {shop.aboutPurpose ?? shop.aboutOffering}
          </p>
          <Link
            href={`/shop/${shop.slug}/about`}
            className="inline-block bg-black text-[var(--mt-accent)] px-6 py-3 font-bold uppercase text-xs tracking-widest hover:bg-[var(--mt-accent)] hover:text-black border-2 border-black"
          >
            Full Story →
          </Link>
        </div>
      </section>
    </div>
  );
}

function BoldCard({
  shop,
  product,
  rates,
  big = false,
}: {
  shop: ShopLayoutProps['shop'];
  product: ShopLayoutProps['products'][number];
  rates: ShopLayoutProps['rates'];
  big?: boolean;
}) {
  const photo = product.photos?.[0];
  return (
    <Link
      href={`/shop/${shop.slug}/product/${product.id}`}
      className="group block border-4 border-black bg-white hover:bg-[var(--mt-accent)]/20 transition-colors"
    >
      <div
        className={`relative ${big ? 'aspect-[4/3]' : 'aspect-square'} bg-gray-100 border-b-4 border-black`}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={product.name}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-widest text-gray-400">
            no photo
          </div>
        )}
        {product.discountPct > 0 && (
          <span className="absolute top-0 left-0 bg-[var(--mt-accent)] text-black font-black text-xs uppercase px-3 py-1.5 border-r-4 border-b-4 border-black">
            -{product.discountPct}% OFF
          </span>
        )}
      </div>
      <div className={big ? 'p-5' : 'p-3'}>
        <h4
          className={`font-[var(--mt-font-display)] font-black uppercase leading-none tracking-tight mb-2 ${
            big ? 'text-2xl md:text-3xl' : 'text-base'
          }`}
        >
          {product.name}
        </h4>
        <PriceDisplay
          priceKes={product.priceKes}
          discountPct={product.discountPct}
          rates={rates}
          compact={!big}
        />
      </div>
    </Link>
  );
}
