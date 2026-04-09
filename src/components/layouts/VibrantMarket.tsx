import Link from 'next/link';
import type { ShopLayoutProps } from './types';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Badge } from '@/components/ui/Badge';

/**
 * VibrantMarket — dense, bright, energetic grid. Bold primary/secondary
 * blocks, Space Grotesk display + Work Sans body. Confetti energy of an
 * actual beach market.
 */
export function VibrantMarket({ shop, products, tokens, rates, children }: ShopLayoutProps) {
  const cssVars = {
    '--mt-primary': tokens.primary,
    '--mt-secondary': tokens.secondary,
    '--mt-accent': tokens.accent,
    '--mt-font-display': `'${tokens.font_display}', sans-serif`,
    '--mt-font-body': `'${tokens.font_body}', sans-serif`,
  } as React.CSSProperties;

  return (
    <div
      style={cssVars}
      className="min-h-screen bg-white text-gray-900 font-[var(--mt-font-body)]"
    >
      {/* Header — bold color block */}
      <header className="bg-[var(--mt-primary)] text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/shop/${shop.slug}`}>
            <h1 className="font-[var(--mt-font-display)] text-2xl font-bold tracking-tight">
              {shop.title}
            </h1>
          </Link>
          <nav className="flex items-center gap-2 text-sm font-bold">
            <Link
              href={`/shop/${shop.slug}`}
              className="px-3 py-1.5 rounded-md hover:bg-white/20"
            >
              Home
            </Link>
            <Link
              href={`/shop/${shop.slug}/about`}
              className="px-3 py-1.5 rounded-md hover:bg-white/20"
            >
              About
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero — bright color block with diagonal accent */}
      <section className="relative bg-[var(--mt-secondary)] text-white overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[var(--mt-accent)]/40 blur-3xl" />
        <div className="absolute -left-20 bottom-0 w-96 h-96 rounded-full bg-[var(--mt-primary)]/40 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-20">
          <Badge variant="accent" size="lg" className="mb-4">
            FRESH FROM DIANI
          </Badge>
          <h2 className="font-[var(--mt-font-display)] text-4xl md:text-6xl font-black leading-none mb-4 max-w-3xl">
            {shop.tagline ?? shop.title}
          </h2>
          {shop.aboutOffering && (
            <p className="text-lg md:text-xl max-w-2xl opacity-95 font-medium">
              {shop.aboutOffering}
            </p>
          )}
        </div>
      </section>

      {/* Main / children slot */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-wrap gap-4 items-center justify-between">
          <p className="font-[var(--mt-font-display)] text-lg font-bold">{shop.title}</p>
          <p className="text-sm text-white/70">Diani Beach · Kenya 🇰🇪</p>
        </div>
      </footer>
    </div>
  );
}

export function VibrantHome({
  shop,
  products,
  rates,
}: Pick<ShopLayoutProps, 'shop' | 'products' | 'rates'>) {
  return (
    <div className="space-y-12">
      <section>
        <div className="flex items-end justify-between mb-6">
          <h3 className="font-[var(--mt-font-display)] text-2xl md:text-3xl font-black">
            TOP PICKS 🔥
          </h3>
          <Link
            href={`/shop/${shop.slug}/about`}
            className="text-sm font-bold text-[var(--mt-primary)] hover:underline"
          >
            MEET THE MAKER →
          </Link>
        </div>

        {/* Dense grid: 2 mobile, 3 tablet, 4 desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {products.map((p, idx) => (
            <VibrantProductCard
              key={p.id}
              shop={shop}
              product={p}
              rates={rates}
              accentBg={idx % 3 === 0}
            />
          ))}
          {products.length === 0 && (
            <p className="col-span-full text-gray-500 italic text-center py-12">
              New products dropping soon!
            </p>
          )}
        </div>
      </section>

      {/* About teaser — color block */}
      <section className="bg-[var(--mt-accent)] rounded-xl p-6 md:p-10 grid md:grid-cols-[auto,1fr] gap-6 items-center">
        {shop.aboutPhotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shop.aboutPhotoUrl}
            alt={shop.aboutName ?? shop.title}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-lg"
          />
        )}
        <div>
          <p className="text-xs font-bold uppercase mb-1 tracking-wider">The Maker</p>
          <h4 className="font-[var(--mt-font-display)] text-2xl md:text-3xl font-black mb-2">
            {shop.aboutName ?? shop.title}
          </h4>
          <p className="text-sm md:text-base leading-snug mb-3 line-clamp-3">
            {shop.aboutPurpose ?? shop.aboutOffering}
          </p>
          <Link
            href={`/shop/${shop.slug}/about`}
            className="inline-block bg-black text-white font-bold px-4 py-2 rounded-md hover:opacity-90"
          >
            Full story →
          </Link>
        </div>
      </section>
    </div>
  );
}

function VibrantProductCard({
  shop,
  product,
  rates,
  accentBg,
}: {
  shop: ShopLayoutProps['shop'];
  product: ShopLayoutProps['products'][number];
  rates: ShopLayoutProps['rates'];
  accentBg: boolean;
}) {
  const photo = product.photos?.[0];
  return (
    <Link
      href={`/shop/${shop.slug}/product/${product.id}`}
      className={`group block rounded-md overflow-hidden border-2 border-black/5 hover:border-[var(--mt-primary)] transition-colors ${
        accentBg ? 'bg-[var(--mt-accent)]/10' : 'bg-white'
      }`}
    >
      <div className="relative aspect-square bg-gray-100">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            No photo
          </div>
        )}
        {product.discountPct > 0 && (
          <div className="absolute top-2 left-2">
            <Badge variant="discount" size="lg">
              -{product.discountPct}%
            </Badge>
          </div>
        )}
      </div>
      <div className="p-3">
        <h4 className="font-[var(--mt-font-display)] font-bold text-sm md:text-base leading-tight mb-1 line-clamp-2">
          {product.name}
        </h4>
        <PriceDisplay
          priceKes={product.priceKes}
          discountPct={product.discountPct}
          rates={rates}
          compact
        />
      </div>
    </Link>
  );
}
