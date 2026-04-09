import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, desc, eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';
import {
  applyMockupForm,
  generateMockupsForm,
} from '@/app/actions/shop-admin';

export const dynamic = 'force-dynamic';

async function loadData(shopId: number) {
  const [shop] = await db
    .select()
    .from(schema.shops)
    .where(eq(schema.shops.id, shopId))
    .limit(1);
  if (!shop) return null;

  // Latest batch of pending mockups (ordered by variant_index)
  const mockups = await db
    .select()
    .from(schema.shopMockups)
    .where(
      and(
        eq(schema.shopMockups.shopId, shopId),
        eq(schema.shopMockups.status, 'pending'),
      ),
    )
    .orderBy(desc(schema.shopMockups.createdAt), schema.shopMockups.variantIndex)
    .limit(3);

  return { shop, mockups };
}

export default async function MockupsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: idParam } = await params;
  const sp = await searchParams;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const data = await loadData(id);
  if (!data) notFound();
  const { shop, mockups } = data;

  const errorMsg = typeof sp.error === 'string' ? sp.error : null;

  const regenerateAction = generateMockupsForm.bind(null, shop.id);

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
        <h1 className="mt-1 font-display text-4xl text-teal-900">
          Design Mockups
        </h1>
        <p className="mt-2 text-sm text-teal-900/60 max-w-2xl">
          Three AI-generated interpretations of {shop.title}'s brand values.
          Each mockup picks a different layout variant and color/typography
          combination. Preview the full shop home in each card, then click
          "Apply this mockup" to make it live.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>Generation failed:</strong> {errorMsg}
        </div>
      )}

      {mockups.length === 0 ? (
        <div className="rounded-2xl border border-teal-900/10 bg-sand-50 p-10 text-center">
          <p className="font-display text-xl text-teal-900">No mockups yet</p>
          <p className="mt-2 text-sm text-teal-900/60 max-w-lg mx-auto">
            Go to Brand Values, rank the 5 values, then click
            "Generate 3 Mockups based on new setting" — you'll end up back
            here with three interpretations to choose from.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href={`/admin/shops/${shop.id}/brand-values`}
              className="inline-flex items-center rounded-lg border border-teal-900/15 px-4 py-2 text-sm font-semibold text-teal-900 hover:border-ochre-500 hover:text-ochre-600 transition"
            >
              Edit brand values
            </Link>
            <form action={regenerateAction}>
              <button
                type="submit"
                className="inline-flex items-center rounded-lg bg-ochre-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-ochre-600 transition"
              >
                Generate 3 mockups now
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {mockups.map((m) => {
            const apply = applyMockupForm.bind(null, shop.id, m.id);
            const previewSrc = `/mockup-preview/${m.id}`;
            return (
              <div
                key={m.id}
                className="rounded-2xl border border-teal-900/10 bg-white shadow-sm overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div
                  className="px-5 py-4 border-b border-teal-900/5"
                  style={{
                    background: `linear-gradient(135deg, ${m.designTokens.primary}, ${m.designTokens.secondary})`,
                  }}
                >
                  <p className="text-[10px] font-bold tracking-widest uppercase text-white/70">
                    Variant {m.variantIndex}
                  </p>
                  <h3 className="font-display text-2xl text-white leading-tight">
                    {m.name}
                  </h3>
                </div>

                {/* Swatches + layout badge */}
                <div className="px-5 py-3 bg-sand-50 border-b border-teal-900/5 flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded-full border border-black/10"
                    style={{ backgroundColor: m.designTokens.primary }}
                    title={`primary ${m.designTokens.primary}`}
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-black/10"
                    style={{ backgroundColor: m.designTokens.secondary }}
                    title={`secondary ${m.designTokens.secondary}`}
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-black/10"
                    style={{ backgroundColor: m.designTokens.accent }}
                    title={`accent ${m.designTokens.accent}`}
                  />
                  <span className="text-[10px] text-teal-900/60 ml-auto font-mono">
                    {m.layoutVariant}
                  </span>
                </div>

                {/* Preview iframe */}
                <div className="relative bg-white" style={{ height: '560px' }}>
                  <iframe
                    src={previewSrc}
                    className="absolute inset-0 w-full h-full border-0"
                    sandbox="allow-same-origin"
                    loading="lazy"
                    title={`Preview: ${m.name}`}
                  />
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-teal-900/50 mb-1">
                      Copy tone
                    </p>
                    <p className="text-xs text-teal-900/70 leading-snug italic">
                      &ldquo;{m.copyTone}&rdquo;
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-teal-900/50 mb-1">
                      Why
                    </p>
                    <p className="text-xs text-teal-900/70 leading-snug">
                      {m.rationale}
                    </p>
                  </div>
                  <div className="mt-auto">
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-teal-900/50 mb-1">
                      Typography
                    </p>
                    <p className="text-xs text-teal-900/60 font-mono">
                      {m.designTokens.font_display} / {m.designTokens.font_body}
                    </p>
                  </div>
                </div>

                {/* Apply button */}
                <form action={apply} className="px-5 pb-5">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center rounded-lg bg-ochre-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-ochre-600 transition"
                  >
                    Apply this mockup
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between rounded-xl border border-teal-900/10 bg-sand-50 p-4">
        <Link
          href={`/admin/shops/${shop.id}/brand-values`}
          className="text-sm text-teal-900/70 hover:text-ochre-600"
        >
          ← Back to brand values
        </Link>
        {mockups.length > 0 && (
          <form action={regenerateAction}>
            <button
              type="submit"
              className="inline-flex items-center rounded-lg border border-ochre-400 px-4 py-2 text-sm font-semibold text-ochre-600 hover:bg-ochre-50 transition"
            >
              Regenerate 3 new mockups
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
