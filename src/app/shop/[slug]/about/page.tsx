import Link from 'next/link';
import { loadShop } from '../_loaders';

type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * About page — full about copy + brand values + production notes.
 * Rendered inside the dynamic shop layout from `../layout.tsx`, so we only
 * need to output the "main body" content. Styles pull from the same
 * --mt-* CSS variables set by the parent layout.
 */
export default async function AboutPage({ params }: PageProps) {
  const { slug } = await params;
  const { shop } = await loadShop(slug);

  return (
    <article className="max-w-4xl mx-auto px-6 py-16 font-[var(--mt-font-body)]">
      <header className="mb-12 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--mt-primary)] mb-3">
          About the maker
        </p>
        <h1 className="font-[var(--mt-font-display)] text-4xl md:text-5xl leading-tight mb-4">
          {shop.aboutName ?? shop.title}
        </h1>
        {shop.tagline && <p className="text-lg opacity-75">{shop.tagline}</p>}
      </header>

      {shop.aboutPhotoUrl && (
        <div className="relative aspect-[16/9] overflow-hidden mb-12 rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shop.aboutPhotoUrl}
            alt={shop.aboutName ?? shop.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="space-y-10">
        {shop.aboutOffering && (
          <section>
            <h2 className="font-[var(--mt-font-display)] text-2xl mb-3 text-[var(--mt-primary)]">
              What we make
            </h2>
            <p className="leading-relaxed text-base md:text-lg whitespace-pre-line">
              {shop.aboutOffering}
            </p>
          </section>
        )}

        {shop.aboutPurpose && (
          <section>
            <h2 className="font-[var(--mt-font-display)] text-2xl mb-3 text-[var(--mt-primary)]">
              Why we make it
            </h2>
            <p className="leading-relaxed text-base md:text-lg whitespace-pre-line">
              {shop.aboutPurpose}
            </p>
          </section>
        )}

        {shop.aboutProduction && (
          <section>
            <h2 className="font-[var(--mt-font-display)] text-2xl mb-3 text-[var(--mt-primary)]">
              How it's made
            </h2>
            <p className="leading-relaxed text-base md:text-lg whitespace-pre-line">
              {shop.aboutProduction}
            </p>
          </section>
        )}

        {shop.brandValues && shop.brandValues.length > 0 && (
          <section>
            <h2 className="font-[var(--mt-font-display)] text-2xl mb-4 text-[var(--mt-primary)]">
              What we stand for
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shop.brandValues.map((v) => (
                <li
                  key={v}
                  className="border-l-4 border-[var(--mt-primary)] pl-4 py-2 bg-black/5"
                >
                  {v}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="mt-16 pt-8 border-t border-black/10 text-center">
        <Link
          href={`/shop/${slug}`}
          className="inline-block text-[var(--mt-primary)] underline underline-offset-4 hover:opacity-70"
        >
          ← Back to shop
        </Link>
      </div>
    </article>
  );
}
