import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, schema } from '@/lib/db/client';
import { eq } from 'drizzle-orm';
import { updateBrandValuesForm } from '@/app/actions/shop-admin';

export const dynamic = 'force-dynamic';

async function loadShop(id: number) {
  const [shop] = await db
    .select()
    .from(schema.shops)
    .where(eq(schema.shops.id, id))
    .limit(1);
  return shop ?? null;
}

const DEFAULT_PRIMARY = '#c87a1f';
const DEFAULT_SECONDARY = '#0f7080';

export default async function BrandValuesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const shop = await loadShop(id);
  if (!shop) notFound();

  const primary = shop.designTokens?.primary ?? DEFAULT_PRIMARY;
  const secondary = shop.designTokens?.secondary ?? DEFAULT_SECONDARY;

  const values: string[] = Array.isArray(shop.brandValues)
    ? shop.brandValues.slice(0, 5)
    : [];
  const bvPadded = Array.from({ length: 5 }, (_, i) => values[i] ?? '');

  const action = updateBrandValuesForm.bind(null, shop.id);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <Link
          href={`/admin/shops/${shop.id}`}
          className="text-xs text-teal-900/50 hover:text-ochre-500 transition inline-flex items-center gap-1"
        >
          ← {shop.title}
        </Link>
        <h1 className="mt-1 font-display text-4xl text-teal-900">Brand Values</h1>
        <p className="mt-2 text-sm text-teal-900/60 max-w-2xl">
          The five promises {shop.title} stands for. These appear on every shop
          page and on business cards — make them count. Empty values will be
          dropped automatically; a shop can have between 1 and 5.
        </p>
      </div>

      {/* Hero strip */}
      <div
        className="rounded-2xl p-6 text-white shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${primary}, ${secondary})`,
        }}
      >
        <p className="text-xs font-semibold tracking-widest uppercase opacity-80">
          What we stand for
        </p>
        <p className="mt-1 font-display text-3xl">{shop.title}</p>
        <p className="mt-2 text-sm opacity-80">
          Edit each card below and press <strong>Save all 5</strong> at the bottom.
        </p>
      </div>

      <form action={action} className="space-y-8">
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
          {bvPadded.map((val, i) => (
            <div
              key={i}
              className="relative rounded-2xl border-2 bg-gradient-to-br from-sand-50 to-white shadow-sm hover:shadow-lg transition group"
              style={{ borderColor: `${primary}40` }}
            >
              {/* Number badge */}
              <div
                className="absolute -top-4 -left-4 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md"
                style={{ backgroundColor: primary }}
              >
                {i + 1}
              </div>

              <div className="p-5 pt-7">
                <label className="block text-[10px] font-semibold tracking-widest uppercase text-teal-900/50 mb-2">
                  Value {i + 1}
                </label>
                <textarea
                  name={`value_${i}`}
                  defaultValue={val}
                  rows={5}
                  className="w-full resize-none rounded-lg border border-teal-900/10 bg-white px-3 py-2 text-sm text-teal-900 placeholder:text-teal-900/30 focus:outline-none focus:ring-2 transition font-display leading-snug"
                  style={{
                    boxShadow: `0 0 0 0 ${primary}`,
                  }}
                  placeholder={
                    [
                      'Handcrafted with care',
                      'Rooted in Diani',
                      'Fair to every maker',
                      'Lasting, not throw-away',
                      'Straight from the source',
                    ][i]
                  }
                />
                <p className="mt-2 text-[10px] text-teal-900/40">
                  Keep it short. One sentence is ideal.
                </p>
              </div>

              {/* Decorative corner */}
              <div
                className="absolute bottom-0 right-0 w-16 h-16 opacity-10 pointer-events-none rounded-tl-full"
                style={{ backgroundColor: primary }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-teal-900/10 bg-sand-50 p-4">
          <div>
            <p className="text-sm font-semibold text-teal-900">
              Save all 5 at once
            </p>
            <p className="text-[11px] text-teal-900/50 mt-0.5">
              Empty fields are dropped. Press save to publish.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/shops/${shop.id}`}
              className="inline-flex items-center rounded-lg border border-teal-900/15 px-4 py-2 text-sm font-semibold text-teal-900 hover:border-ochre-500 hover:text-ochre-600 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-ochre-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-ochre-600 transition"
            >
              Save all 5 values
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
