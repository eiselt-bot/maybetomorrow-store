import Link from 'next/link';
import { notFound } from 'next/navigation';

import { loadProduct, loadShop } from '../../_loaders';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

type PageProps = {
  params: Promise<{ slug: string; id: string }>;
};

/**
 * Product detail page — inside the shop layout chrome.
 * Renders: photo gallery (grid-based for now, fully server-rendered),
 * description, production info, price, and CTA to checkout.
 */
export default async function ProductPage({ params }: PageProps) {
  const { slug, id } = await params;
  const productId = Number.parseInt(id, 10);
  if (!Number.isFinite(productId)) notFound();

  const [found, { rates }] = await Promise.all([
    loadProduct(slug, productId),
    loadShop(slug),
  ]);
  if (!found) notFound();
  const { shop, product } = found;

  const photos = product.photos ?? [];
  const mainPhoto = photos[0];
  const thumbPhotos = photos.slice(1, 5);

  return (
    <article className="max-w-6xl mx-auto px-6 py-12 font-[var(--mt-font-body)]">
      {/* Breadcrumb */}
      <nav className="text-sm mb-8 opacity-70">
        <Link href={`/shop/${slug}`} className="hover:text-[var(--mt-primary)]">
          {shop.title}
        </Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
        {/* Photos */}
        <div>
          <div className="relative aspect-square bg-black/5 overflow-hidden mb-4 rounded-lg">
            {mainPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainPhoto}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-black/40">
                No photo available
              </div>
            )}
            {product.discountPct > 0 && (
              <div className="absolute top-4 right-4">
                <Badge variant="discount" size="lg">
                  -{product.discountPct}%
                </Badge>
              </div>
            )}
          </div>
          {thumbPhotos.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {thumbPhotos.map((p, i) => (
                <div
                  key={`${p}-${i}`}
                  className="aspect-square bg-black/5 overflow-hidden rounded"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p}
                    alt={`${product.name} ${i + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="font-[var(--mt-font-display)] text-4xl md:text-5xl leading-tight mb-4">
            {product.name}
          </h1>

          <div className="mb-6">
            <PriceDisplay
              priceKes={product.priceKes}
              discountPct={product.discountPct}
              rates={rates}
            />
          </div>

          {product.description && (
            <section className="mb-6">
              <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--mt-primary)] mb-2">
                Description
              </h2>
              <p className="leading-relaxed whitespace-pre-line">{product.description}</p>
            </section>
          )}

          {product.productionInfo && (
            <section className="mb-6">
              <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--mt-primary)] mb-2">
                Production
              </h2>
              <p className="leading-relaxed whitespace-pre-line opacity-85">
                {product.productionInfo}
              </p>
            </section>
          )}

          <div className="mb-8 py-4 border-y border-black/10 text-sm flex flex-wrap gap-4 items-center">
            <div>
              <span className="opacity-60">Delivery:</span>{' '}
              <span className="font-semibold">
                {product.deliveryDays ?? 1} day{(product.deliveryDays ?? 1) === 1 ? '' : 's'}
              </span>
            </div>
            {product.soldCount > 0 && (
              <div>
                <span className="opacity-60">Sold:</span>{' '}
                <span className="font-semibold">{product.soldCount}×</span>
              </div>
            )}
          </div>

          <Link href={`/shop/${slug}/checkout`} className="inline-block w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              Order now →
            </Button>
          </Link>

          <p className="mt-4 text-xs opacity-60">
            Cash on delivery · Diani Strip + South Coast
          </p>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-black/10">
        <Link
          href={`/shop/${slug}`}
          className="text-sm text-[var(--mt-primary)] underline underline-offset-4 hover:opacity-70"
        >
          ← Back to {shop.title}
        </Link>
      </div>
    </article>
  );
}
