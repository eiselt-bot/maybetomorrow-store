import Link from 'next/link';
import type { ShopLayoutProps } from './types';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Badge } from '@/components/ui/Badge';

/**
 * OceanCalm — soft blues, plenty of air, centered content, polaroid-style
 * product photos with white borders and a slight rotation. Cormorant Garamond
 * display + DM Sans body. A breathy, spa-like feel.
 */
export function OceanCalm({ shop, products, tokens, rates, children }: ShopLayoutProps) {
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
      className="min-h-screen bg-gradient-to-b from-[#F0F8FB] via-white to-[#E8F4F8] text-slate-700 font-[var(--mt-font-body)]"
    >
      {/* Header — centered, airy */}
      <header className="pt-10 pb-6">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <Link href={`/shop/${shop.slug}`}>
            <h1 className="font-[var(--mt-font-display)] text-3xl italic text-[var(--mt-primary)]">
              {shop.title}
            </h1>
          </Link>
          <nav className="flex items-center justify-center gap-8 mt-4 text-xs uppercase tracking-[0.25em] text-slate-500">
            <Link href={`/shop/${shop.slug}`} className="hover:text-[var(--mt-primary)]">
              Home
            </Link>
            <span className="text-slate-300">·</span>
            <Link
              href={`/shop/${shop.slug}/about`}
              className="hover:text-[var(--mt-primary)]"
            >
              About
            </Link>
            <span className="text-slate-300">·</span>
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
      <section>
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <div className="inline-block mb-6">
            <div className="h-px w-16 bg-[var(--mt-primary)] mx-auto mb-4" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--mt-primary)]">
              Where the tide rests
            </p>
            <div className="h-px w-16 bg-[var(--mt-primary)] mx-auto mt-4" />
          </div>
          <h2 className="font-[var(--mt-font-display)] italic text-4xl md:text-5xl leading-tight text-slate-800 mb-6">
            {shop.tagline ?? shop.title}
          </h2>
          {shop.aboutOffering && (
            <p className="max-w-xl mx-auto text-base leading-relaxed text-slate-600">
              {shop.aboutOffering}
            </p>
          )}
        </div>
      </section>

      {/* Main / children slot */}
      <main className="max-w-5xl mx-auto px-6 pb-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center py-10 text-xs text-slate-500">
        <div className="h-px w-16 bg-slate-300 mx-auto mb-4" />
        <p className="font-[var(--mt-font-display)] italic text-base text-slate-700 mb-1">
          {shop.title}
        </p>
        <p>Diani Beach · Kenya</p>
      </footer>
    </div>
  );
}

export function OceanHome({
  shop,
  products,
  rates,
}: Pick<ShopLayoutProps, 'shop' | 'products' | 'rates'>) {
  return (
    <div className="space-y-20">
      {/* Products as polaroids */}
      <section>
        <div className="text-center mb-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--mt-primary)] mb-2">
            Selected pieces
          </p>
          <h3 className="font-[var(--mt-font-display)] italic text-3xl text-slate-800">
            Five things we love
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 justify-items-center">
          {products.map((p, idx) => (
            <OceanPolaroid
              key={p.id}
              shop={shop}
              product={p}
              rates={rates}
              rotate={idx % 2 === 0 ? -2 : 2}
            />
          ))}
          {products.length === 0 && (
            <p className="col-span-full text-slate-400 italic text-center py-16">
              Low tide. New arrivals soon.
            </p>
          )}
        </div>
      </section>

      {/* About teaser */}
      <section className="text-center max-w-2xl mx-auto">
        {shop.aboutPhotoUrl && (
          <div className="inline-block p-3 bg-white shadow-xl rotate-1 mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shop.aboutPhotoUrl}
              alt={shop.aboutName ?? shop.title}
              className="w-40 h-40 object-cover"
            />
          </div>
        )}
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--mt-primary)] mb-2">
          The maker
        </p>
        <h4 className="font-[var(--mt-font-display)] italic text-2xl text-slate-800 mb-4">
          {shop.aboutName ?? 'Our story'}
        </h4>
        <p className="text-slate-600 leading-relaxed line-clamp-4 mb-5">
          {shop.aboutPurpose ?? shop.aboutOffering}
        </p>
        <Link
          href={`/shop/${shop.slug}/about`}
          className="inline-block text-[var(--mt-primary)] italic font-[var(--mt-font-display)] text-lg underline-offset-4 hover:underline"
        >
          continue reading
        </Link>
      </section>
    </div>
  );
}

function OceanPolaroid({
  shop,
  product,
  rates,
  rotate,
}: {
  shop: ShopLayoutProps['shop'];
  product: ShopLayoutProps['products'][number];
  rates: ShopLayoutProps['rates'];
  rotate: number;
}) {
  const photo = product.photos?.[0];
  return (
    <Link
      href={`/shop/${shop.slug}/product/${product.id}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      className="group block bg-white p-4 pb-6 shadow-lg hover:shadow-2xl hover:rotate-0 transition-all duration-500"
    >
      <div className="relative w-56 h-56 bg-slate-100 overflow-hidden mb-4">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
            No photo
          </div>
        )}
        {product.discountPct > 0 && (
          <div className="absolute top-2 right-2">
            <Badge variant="discount">-{product.discountPct}%</Badge>
          </div>
        )}
      </div>
      <div className="text-center">
        <h4 className="font-[var(--mt-font-display)] italic text-lg text-slate-800 mb-2">
          {product.name}
        </h4>
        <PriceDisplay
          priceKes={product.priceKes}
          discountPct={product.discountPct}
          rates={rates}
          compact
          className="items-center text-center"
        />
      </div>
    </Link>
  );
}
