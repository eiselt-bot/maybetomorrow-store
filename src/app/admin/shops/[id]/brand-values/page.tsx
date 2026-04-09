import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, schema } from '@/lib/db/client';
import { eq } from 'drizzle-orm';
import { updateBrandValuesForm, generateMockupsForm } from '@/app/actions/shop-admin';
import { BrandValuesEditor } from '@/components/ui/BrandValuesEditor';

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
  const genAction = generateMockupsForm.bind(null, shop.id);

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
        <BrandValuesEditor initialValues={bvPadded} primary={primary} />

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
    

      {/* Generate mockups card */}
      <div className="rounded-2xl border-2 border-dashed border-ochre-300 bg-gradient-to-br from-ochre-50 to-sand-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-ochre-600 mb-2">
              AI Design
            </p>
            <h2 className="font-display text-2xl text-teal-900 mb-2">
              Generate 3 Mockups based on new setting
            </h2>
            <p className="text-sm text-teal-900/70 leading-snug max-w-xl">
              Once you\'ve saved the brand values above, click this to have
              Claude produce three distinct design interpretations — each
              picks a layout variant, color palette, fonts, and copy tone
              that lean into your ranked values differently. You\'ll land
              on the mockups page where you can preview and apply the one
              you like.
            </p>
          </div>
          <form action={genAction}>
            <button
              type="submit"
              className="whitespace-nowrap inline-flex items-center rounded-lg bg-ochre-500 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-ochre-600 transition"
            >
              ✨ Generate 3 mockups
            </button>
          </form>
        </div>
        <div className="mt-4 pt-4 border-t border-ochre-200/50 flex items-center gap-2 text-xs text-teal-900/60">
          <span>Already generated?</span>
          <Link
            href={`/admin/shops/${shop.id}/mockups`}
            className="font-semibold text-ochre-600 hover:text-ochre-700"
          >
            View pending mockups →
          </Link>
        </div>
      </div>
    </div>
  );
}