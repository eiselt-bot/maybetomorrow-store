import Link from 'next/link';
import { db, schema } from '@/lib/db/client';
import { eq, sql } from 'drizzle-orm';
import { env, isProd } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ShopCard = {
  id: number;
  slug: string;
  title: string;
  tagline: string | null;
  aboutPhotoUrl: string | null;
  brandValues: string[] | null;
};

async function fetchLiveShops(): Promise<ShopCard[]> {
  try {
    // ORDER BY RANDOM() is fine for a handful of shops.
    const rows = await db
      .select({
        id: schema.shops.id,
        slug: schema.shops.slug,
        title: schema.shops.title,
        tagline: schema.shops.tagline,
        aboutPhotoUrl: schema.shops.aboutPhotoUrl,
        brandValues: schema.shops.brandValues,
      })
      .from(schema.shops)
      .where(eq(schema.shops.status, 'live'))
      .orderBy(sql`random()`);
    return rows as ShopCard[];
  } catch (err) {
    console.error('[landing] failed to fetch shops', err);
    return [];
  }
}

function shopUrl(slug: string): string {
  // In production, subdomain routing handles it. In dev, fall through to /shop/{slug}.
  if (isProd) return `https://${slug}.${env.APEX_DOMAIN}`;
  return `/shop/${slug}`;
}

// Deterministic gradient fallback per slug when no photo is set
function gradientFor(slug: string): string {
  const palettes = [
    'from-ochre-400 via-terracotta-500 to-teal-700',
    'from-teal-500 via-teal-700 to-teal-900',
    'from-ochre-500 via-ochre-600 to-terracotta-600',
    'from-sand-200 via-ochre-400 to-terracotta-500',
    'from-teal-700 via-ochre-600 to-terracotta-600',
  ];
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return palettes[h % palettes.length];
}

export default async function HomePage() {
  const shops = await fetchLiveShops();

  return (
    <main className="flex flex-col flex-1">
      {/* ===== HERO ===== */}
      <section className="mt-hero-grain relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, #1a1410 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-28 sm:pt-28 sm:pb-36">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 bg-sand-100 border border-ochre-400/30 rounded-full px-4 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-ochre-500 animate-pulse" />
              Diani Beach · Kenya
            </p>

            <h1 className="mt-6 font-display text-[clamp(3rem,8vw,6rem)] leading-[0.95] tracking-tight text-teal-900">
              Maybe<span className="text-ochre-500">Tomorrow</span>
              <span className="text-teal-700">.store</span>
            </h1>

            <p className="mt-6 text-xl sm:text-2xl font-display text-teal-900/85 leading-snug max-w-2xl">
              Handcrafted on Diani Beach — delivered to your doorstep in Kenya.
            </p>

            <div className="mt-6 max-w-2xl text-base sm:text-lg text-teal-900/70 leading-relaxed space-y-2">
              <p>
                A cooperative of beach vendors who hand-make shoes, beads,
                kangas, and coconut treats just a few steps from the Indian
                Ocean. Order today — or maybe tomorrow. Either way, it arrives
                made with care.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a
                href="#shops"
                className="inline-flex items-center rounded-full bg-teal-900 px-7 py-3.5 text-sand-50 font-medium hover:bg-teal-700 transition shadow-lg shadow-teal-900/20"
              >
                Browse the shops
              </a>
              <a
                href="#how"
                className="inline-flex items-center rounded-full bg-sand-100 border border-teal-900/15 px-7 py-3.5 text-teal-900 font-medium hover:bg-sand-200 transition"
              >
                How it works
              </a>
            </div>
          </div>

          {/* decorative curl */}
          <div
            className="hidden lg:block absolute right-[-4rem] bottom-[-4rem] w-[28rem] h-[28rem] rounded-full"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, rgba(217,149,67,0.45), rgba(184,69,31,0.2) 45%, transparent 70%)',
              filter: 'blur(2px)',
            }}
          />
        </div>
      </section>

      {/* ===== SHOP DIRECTORY ===== */}
      <section id="shops" className="bg-sand-50 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between gap-6 flex-wrap mb-12">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-ochre-600">
                Our artisans
              </p>
              <h2 className="font-display text-4xl sm:text-5xl text-teal-900 mt-2">
                Meet the shops
              </h2>
              <p className="mt-3 text-teal-900/70 max-w-xl">
                Every visit shuffles the order — no favourites, just five
                storytellers waiting to meet you.
              </p>
            </div>
            <span className="text-sm text-teal-900/60">
              {shops.length} live {shops.length === 1 ? 'shop' : 'shops'}
            </span>
          </div>

          {shops.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-teal-900/20 bg-sand-100/60 p-16 text-center">
              <p className="font-display text-2xl text-teal-900">
                The shops are still setting up their stalls.
              </p>
              <p className="mt-2 text-teal-900/70">
                Come back soon — or check{' '}
                <Link href="/admin/login" className="underline text-ochre-600">
                  the admin
                </Link>
                .
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop) => (
                <li
                  key={shop.id}
                  className="group relative flex flex-col rounded-3xl overflow-hidden bg-white border border-teal-900/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* photo or gradient */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {shop.aboutPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={shop.aboutPhotoUrl}
                        alt={shop.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-br ${gradientFor(
                          shop.slug,
                        )} relative`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-display text-6xl text-white/90 drop-shadow-md">
                            {shop.title.charAt(0)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>

                  <div className="flex-1 flex flex-col p-6">
                    <h3 className="font-display text-2xl text-teal-900 leading-tight">
                      {shop.title}
                    </h3>
                    {shop.tagline && (
                      <p className="mt-2 text-sm text-teal-900/70 line-clamp-2">
                        {shop.tagline}
                      </p>
                    )}

                    {shop.brandValues && shop.brandValues.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-1.5">
                        {shop.brandValues.slice(0, 4).map((v) => (
                          <li
                            key={v}
                            className="text-[11px] font-medium tracking-wide uppercase text-ochre-600 bg-ochre-400/10 border border-ochre-400/30 rounded-full px-2.5 py-1"
                          >
                            {v}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-auto pt-6">
                      <a
                        href={shopUrl(shop.slug)}
                        className="inline-flex items-center gap-2 text-teal-900 font-medium group-hover:text-ochre-600 transition"
                      >
                        Visit shop
                        <span
                          aria-hidden
                          className="transition-transform group-hover:translate-x-1"
                        >
                          →
                        </span>
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="bg-sand-100 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-widest uppercase text-ochre-600">
              How it works
            </p>
            <h2 className="font-display text-4xl sm:text-5xl text-teal-900 mt-2">
              From the sand to your door
            </h2>
          </div>

          <ol className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                n: '01',
                t: 'Pick your shop',
                d: 'Scan a card on the beach or browse the shops right here.',
              },
              {
                n: '02',
                t: 'Order in minutes',
                d: 'Choose what you love, pay on delivery or online — whichever you trust.',
              },
              {
                n: '03',
                t: 'We deliver',
                d: 'Our drivers carry it from the beach to your address, anywhere in Kenya.',
              },
            ].map((step) => (
              <li
                key={step.n}
                className="rounded-3xl bg-white border border-teal-900/10 p-8"
              >
                <p className="font-display text-4xl text-ochre-500">{step.n}</p>
                <h3 className="font-display text-xl text-teal-900 mt-4">
                  {step.t}
                </h3>
                <p className="mt-2 text-teal-900/70 text-sm leading-relaxed">
                  {step.d}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-teal-900 text-sand-100 py-14">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-display text-2xl">MaybeTomorrow.store</p>
            <p className="text-sm text-sand-200/70 mt-1">
              Handcrafted on Diani Beach · {new Date().getFullYear()}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-6 text-sm">
            <a href="#shops" className="hover:text-ochre-400 transition">
              Shops
            </a>
            <a href="#how" className="hover:text-ochre-400 transition">
              How it works
            </a>
            <Link
              href="/admin/login"
              className="hover:text-ochre-400 transition"
            >
              Admin
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
