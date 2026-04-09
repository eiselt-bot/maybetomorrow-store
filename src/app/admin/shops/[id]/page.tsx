import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, schema } from '@/lib/db/client';
import { eq, desc } from 'drizzle-orm';
import {
  updateShopAboutForm,
  updateBrandValuesForm,
  updateLayoutVariantForm,
  updateDesignTokensForm,
  updateShopSettingsForm,
  toggleProductTop5Form,
  deleteProductForm,
} from '@/app/actions/shop-admin';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import type { LayoutVariant } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

// ============================================================================
// Static data
// ============================================================================

const LAYOUT_VARIANTS: {
  value: LayoutVariant;
  label: string;
  mood: string;
}[] = [
  {
    value: 'earthy-artisan',
    label: 'Earthy Artisan',
    mood: 'Warm terracotta, hand-made, storytelling — perfect for makers and craft.',
  },
  {
    value: 'vibrant-market',
    label: 'Vibrant Market',
    mood: 'Bold colors, bustling energy, strong contrasts — for busy traders.',
  },
  {
    value: 'ocean-calm',
    label: 'Ocean Calm',
    mood: 'Soft teals and creams, airy and coastal — for seaside shops.',
  },
  {
    value: 'heritage-story',
    label: 'Heritage Story',
    mood: 'Editorial, documentary, deep roots — for generational businesses.',
  },
  {
    value: 'bold-maker',
    label: 'Bold Maker',
    mood: 'Confident display type, strong grids — for statement brands.',
  },
];

const DEFAULT_TOKENS = {
  primary: '#c87a1f',
  secondary: '#0f7080',
  accent: '#d99543',
  font_display: 'Fraunces',
  font_body: 'Inter',
  radius: 'md' as const,
  hero_treatment: 'warm-overlay' as const,
};

// ============================================================================
// Data loader
// ============================================================================

async function loadShop(id: number) {
  const [shop] = await db
    .select()
    .from(schema.shops)
    .where(eq(schema.shops.id, id))
    .limit(1);
  if (!shop) return null;

  const products = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.shopId, id))
    .orderBy(desc(schema.products.createdAt));

  return { shop, products };
}

// ============================================================================
// Small building blocks
// ============================================================================

function SectionCard({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-8 rounded-2xl border border-teal-900/10 bg-white shadow-sm"
    >
      <div className="px-6 pt-6 pb-4 border-b border-teal-900/5">
        <h2 className="font-display text-2xl text-teal-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-teal-900/60">{description}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold tracking-widest uppercase text-teal-900/60 mb-1.5">
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-lg border border-teal-900/15 bg-white px-3 py-2 text-sm text-teal-900 placeholder:text-teal-900/30 focus:border-ochre-500 focus:outline-none focus:ring-2 focus:ring-ochre-400/30 transition';

const textareaClass = `${inputClass} min-h-[90px] resize-y`;

function SaveButton({ children = 'Save' }: { children?: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="inline-flex items-center gap-2 rounded-lg bg-ochre-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-ochre-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre-400 focus-visible:ring-offset-2 transition"
    >
      {children}
    </button>
  );
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    live: 'bg-teal-500/15 text-teal-700 border-teal-500/30',
    draft: 'bg-sand-200 text-teal-900/60 border-teal-900/10',
    paused: 'bg-ochre-400/15 text-ochre-600 border-ochre-400/30',
    archived: 'bg-terracotta-500/10 text-terracotta-600 border-terracotta-500/30',
  };
  return map[s] || map.draft;
}

// ============================================================================
// Page
// ============================================================================

export default async function AdminShopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const data = await loadShop(id);
  if (!data) notFound();

  const { shop, products } = data;
  const tokens = { ...DEFAULT_TOKENS, ...(shop.designTokens ?? {}) };
  const brandValues: string[] = Array.isArray(shop.brandValues)
    ? shop.brandValues.slice(0, 5)
    : [];
  // Always pad to 5 for the editor grid
  const bvPadded = Array.from({ length: 5 }, (_, i) => brandValues[i] ?? '');

  const currentVariant = (shop.layoutVariant ?? 'earthy-artisan') as LayoutVariant;

  // Bind form actions to this shop
  const aboutAction = updateShopAboutForm.bind(null, shop.id);
  const brandValuesAction = updateBrandValuesForm.bind(null, shop.id);
  const layoutAction = updateLayoutVariantForm.bind(null, shop.id);
  const tokensAction = updateDesignTokensForm.bind(null, shop.id);
  const settingsAction = updateShopSettingsForm.bind(null, shop.id);

  return (
    <div className="space-y-6 pb-16">
      {/* ===== HEADER ===== */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/admin/shops"
            className="text-xs text-teal-900/50 hover:text-ochre-500 transition inline-flex items-center gap-1"
          >
            ← All shops
          </Link>
          <div className="mt-1 flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-4xl text-teal-900">{shop.title}</h1>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${statusBadge(shop.status)}`}
            >
              {shop.status}
            </span>
            {shop.yellowCardCount > 0 && (
              <span className="inline-flex items-center rounded-full border border-ochre-400/40 bg-ochre-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-ochre-600">
                {shop.yellowCardCount} yellow card
                {shop.yellowCardCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-teal-900/60">
            <span className="font-mono text-ochre-600">/{shop.slug}</span>
            {shop.tagline && (
              <span className="ml-2 text-teal-900/50">· {shop.tagline}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/shop/${shop.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-teal-900/15 px-3 py-2 text-xs font-semibold text-teal-900 hover:border-ochre-500 hover:text-ochre-600 transition"
          >
            View live →
          </a>
          <Link
            href={`/admin/shops/${shop.id}/products/new`}
            className="inline-flex items-center gap-1 rounded-lg bg-ochre-500 px-3 py-2 text-xs font-semibold text-white hover:bg-ochre-600 transition"
          >
            + New product
          </Link>
        </div>
      </div>

      {/* ===== SECTION NAV — direct links to each editor page ===== */}
      <nav className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-white/95 backdrop-blur border-y border-teal-900/10">
        <ul className="flex items-center gap-2 text-xs font-semibold overflow-x-auto">
          <li className="flex-shrink-0">
            <a
              href="#about"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-teal-900/70 hover:text-ochre-600 hover:bg-ochre-400/10 transition"
            >
              <span>About</span>
            </a>
          </li>
          <li className="flex-shrink-0">
            <Link
              href={`/admin/shops/${shop.id}/brand-values`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-teal-900/15 bg-white text-teal-900 hover:border-ochre-500 hover:text-ochre-600 transition"
            >
              <span>🎯</span>
              <span>Brand Values ({brandValues.length}/5)</span>
            </Link>
          </li>
          <li className="flex-shrink-0">
            <Link
              href={`/admin/shops/${shop.id}/template`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-teal-900/15 bg-white text-teal-900 hover:border-ochre-500 hover:text-ochre-600 transition"
            >
              <span>🎨</span>
              <span>Template &amp; Design</span>
            </Link>
          </li>
          <li className="flex-shrink-0">
            <Link
              href={`/admin/shops/${shop.id}/mockups`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-teal-900/15 bg-white text-teal-900 hover:border-ochre-500 hover:text-ochre-600 transition"
            >
              <span>✨</span>
              <span>Mockups</span>
            </Link>
          </li>
          <li className="flex-shrink-0">
            <Link
              href={`/admin/shops/${shop.id}/products`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-teal-900/15 bg-white text-teal-900 hover:border-ochre-500 hover:text-ochre-600 transition"
            >
              <span>📦</span>
              <span>Products ({products.length})</span>
            </Link>
          </li>
          <li className="flex-shrink-0">
            <a
              href="#settings"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-teal-900/70 hover:text-ochre-600 hover:bg-ochre-400/10 transition"
            >
              <span>Settings</span>
            </a>
          </li>
          <li className="ml-auto flex-shrink-0">
            <Link
              href={`/admin/shops/${shop.id}/products/new`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ochre-500 text-white hover:bg-ochre-600 transition"
            >
              <span>+</span>
              <span>New product</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* ===== ABOUT ME ===== */}
      <SectionCard
        id="about"
        title="About Me"
        description="The story the customer sees on the shop's About page."
      >
        <form action={aboutAction} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Vendor Name</Label>
            <input
              name="aboutName"
              defaultValue={shop.aboutName ?? ''}
              className={inputClass}
              placeholder="e.g. Mama Amina"
            />
          </div>
          <div>
            <Label>Offering</Label>
            <textarea
              name="aboutOffering"
              defaultValue={shop.aboutOffering ?? ''}
              className={textareaClass}
              placeholder="What do you make or sell?"
            />
          </div>
          <div>
            <Label>Purpose</Label>
            <textarea
              name="aboutPurpose"
              defaultValue={shop.aboutPurpose ?? ''}
              className={textareaClass}
              placeholder="Why do you do this work?"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Production / How it's made</Label>
            <textarea
              name="aboutProduction"
              defaultValue={shop.aboutProduction ?? ''}
              className={textareaClass}
              placeholder="Process, materials, origin..."
            />
          </div>
          <div className="md:col-span-2">
            <PhotoUpload
              name="aboutPhotoUrl"
              label="Vendor photo"
              defaultUrl={shop.aboutPhotoUrl ?? ''}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <SaveButton>Save About</SaveButton>
          </div>
        </form>
      </SectionCard>

      {/* ===== BRAND VALUES ===== */}
      <SectionCard
        id="brand-values"
        title="Brand Values"
        description="The five promises this shop stands for. Shown on every shop page."
      >
        <form action={brandValuesAction} className="space-y-5">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-5">
            {bvPadded.map((val, i) => (
              <div
                key={i}
                className="relative rounded-2xl border-2 p-4 bg-gradient-to-br from-sand-50 to-white hover:shadow-md transition group"
                style={{ borderColor: `${tokens.primary}40` }}
              >
                <div
                  className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                  style={{ backgroundColor: tokens.primary }}
                >
                  {i + 1}
                </div>
                <Label>Value {i + 1}</Label>
                <textarea
                  name={`value_${i}`}
                  defaultValue={val}
                  className={textareaClass}
                  placeholder={`e.g. "Handcrafted with care"`}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-teal-900/50">
              Empty fields will be dropped. Minimum 1, maximum 5.
            </p>
            <SaveButton>Save all 5 values</SaveButton>
          </div>
        </form>
      </SectionCard>

      {/* ===== TEMPLATE ===== */}
      <SectionCard
        id="template"
        title="Template & Design"
        description="Pick a layout variant and tune the brand tokens."
      >
        {/* Current layout banner */}
        <div
          className="rounded-xl p-5 mb-5 border"
          style={{
            background: `linear-gradient(135deg, ${tokens.primary}12, ${tokens.secondary}12)`,
            borderColor: `${tokens.primary}30`,
          }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-teal-900/60">
            Current template
          </p>
          <p className="mt-0.5 font-display text-2xl text-teal-900">
            {LAYOUT_VARIANTS.find((v) => v.value === currentVariant)?.label ??
              currentVariant}
          </p>
          <p className="mt-1 text-sm text-teal-900/60">
            {LAYOUT_VARIANTS.find((v) => v.value === currentVariant)?.mood}
          </p>
        </div>

        {/* Layout picker */}
        <form action={layoutAction} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-5">
            {LAYOUT_VARIANTS.map((v) => (
              <label
                key={v.value}
                className={`relative cursor-pointer rounded-xl border-2 p-3 transition hover:shadow-md ${
                  v.value === currentVariant
                    ? 'border-ochre-500 ring-2 ring-ochre-400/40 bg-ochre-400/5'
                    : 'border-teal-900/10 hover:border-ochre-400/50'
                }`}
              >
                <input
                  type="radio"
                  name="layoutVariant"
                  value={v.value}
                  defaultChecked={v.value === currentVariant}
                  className="sr-only"
                />
                {/* Fake thumbnail */}
                <div
                  className="h-20 rounded-lg mb-2 flex items-end p-2"
                  style={{
                    background: v.value === 'earthy-artisan'
                      ? 'linear-gradient(135deg, #c87a1f, #b8451f)'
                      : v.value === 'vibrant-market'
                      ? 'linear-gradient(135deg, #ff6b35, #f7c548)'
                      : v.value === 'ocean-calm'
                      ? 'linear-gradient(135deg, #0f7080, #8ec8d0)'
                      : v.value === 'heritage-story'
                      ? 'linear-gradient(135deg, #3e2723, #8d6e63)'
                      : 'linear-gradient(135deg, #1a1410, #d99543)',
                  }}
                >
                  <span className="font-display text-white text-sm drop-shadow">
                    Aa
                  </span>
                </div>
                <p className="font-display text-sm text-teal-900 leading-tight">
                  {v.label}
                </p>
                <p className="text-[10px] text-teal-900/55 mt-0.5 leading-snug">
                  {v.mood}
                </p>
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <SaveButton>Switch template</SaveButton>
          </div>
        </form>

        {/* Design tokens */}
        <div className="mt-8 pt-6 border-t border-teal-900/5">
          <h3 className="font-display text-lg text-teal-900 mb-4">
            Design Tokens
          </h3>
          <form action={tokensAction} className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Primary</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="primary"
                  defaultValue={tokens.primary}
                  className="h-10 w-14 cursor-pointer rounded border border-teal-900/15"
                />
                <input
                  type="text"
                  defaultValue={tokens.primary}
                  className={`${inputClass} font-mono text-xs bg-sand-50`}
                  readOnly
                />
              </div>
            </div>
            <div>
              <Label>Secondary</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="secondary"
                  defaultValue={tokens.secondary}
                  className="h-10 w-14 cursor-pointer rounded border border-teal-900/15"
                />
                <input
                  type="text"
                  defaultValue={tokens.secondary}
                  className={`${inputClass} font-mono text-xs bg-sand-50`}
                  readOnly
                />
              </div>
            </div>
            <div>
              <Label>Accent</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="accent"
                  defaultValue={tokens.accent}
                  className="h-10 w-14 cursor-pointer rounded border border-teal-900/15"
                />
                <input
                  type="text"
                  defaultValue={tokens.accent}
                  className={`${inputClass} font-mono text-xs bg-sand-50`}
                  readOnly
                />
              </div>
            </div>
            <div>
              <Label>
                Display font{' '}
                <a
                  href="https://fonts.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-ochre-500 normal-case tracking-normal"
                >
                  (Google Fonts ↗)
                </a>
              </Label>
              <input
                type="text"
                name="font_display"
                defaultValue={tokens.font_display}
                className={inputClass}
                placeholder="Fraunces"
              />
            </div>
            <div>
              <Label>Body font</Label>
              <input
                type="text"
                name="font_body"
                defaultValue={tokens.font_body}
                className={inputClass}
                placeholder="Inter"
              />
            </div>
            <div>
              <Label>Radius</Label>
              <select
                name="radius"
                defaultValue={tokens.radius}
                className={inputClass}
              >
                <option value="none">None (0)</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">Extra large</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Label>Hero treatment</Label>
              <select
                name="hero_treatment"
                defaultValue={tokens.hero_treatment}
                className={inputClass}
              >
                <option value="warm-overlay">Warm overlay</option>
                <option value="cool-overlay">Cool overlay</option>
                <option value="polaroid">Polaroid</option>
                <option value="clean">Clean (no overlay)</option>
                <option value="pattern-bg">Pattern background</option>
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <SaveButton>Save tokens</SaveButton>
            </div>
          </form>
        </div>
      </SectionCard>

      {/* ===== PRODUCTS ===== */}
      <SectionCard
        id="products"
        title="Products"
        description={`${products.length} product${products.length === 1 ? '' : 's'} in this shop.`}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-teal-900/50">
            {products.filter((p) => p.isTop5).length} currently marked Top-5
          </p>
          <Link
            href={`/admin/shops/${shop.id}/products/new`}
            className="inline-flex items-center gap-1 rounded-lg bg-ochre-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ochre-600 transition"
          >
            + New product
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-teal-900/15 bg-sand-50 p-8 text-center">
            <p className="text-sm text-teal-900/60">
              No products yet. Create the first one to populate the shop.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-teal-900/10 overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-sand-100 text-teal-900/70 text-[11px] tracking-wider uppercase">
                <tr>
                  <th className="text-left font-semibold px-3 py-2.5 w-14">
                    Photo
                  </th>
                  <th className="text-left font-semibold px-3 py-2.5">Name</th>
                  <th className="text-right font-semibold px-3 py-2.5">
                    Price
                  </th>
                  <th className="text-right font-semibold px-3 py-2.5">
                    Disc.
                  </th>
                  <th className="text-center font-semibold px-3 py-2.5">
                    Top-5
                  </th>
                  <th className="text-right font-semibold px-3 py-2.5">
                    Sold
                  </th>
                  <th className="text-left font-semibold px-3 py-2.5">
                    Status
                  </th>
                  <th className="text-right font-semibold px-3 py-2.5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-900/5">
                {products.map((p) => {
                  const photo = Array.isArray(p.photos) && p.photos.length > 0
                    ? p.photos[0]
                    : null;
                  const toggleTop5 = toggleProductTop5Form.bind(
                    null,
                    shop.id,
                    p.id,
                  );
                  const del = deleteProductForm.bind(null, shop.id, p.id);
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-sand-50/60 transition"
                    >
                      <td className="px-3 py-2">
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo}
                            alt={p.name}
                            className="h-10 w-10 rounded-md object-cover border border-teal-900/10"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-sand-100 border border-teal-900/10" />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/shops/${shop.id}/products/${p.id}`}
                          className="font-medium text-teal-900 hover:text-ochre-600"
                        >
                          {p.name}
                        </Link>
                        {p.description && (
                          <p className="text-[11px] text-teal-900/50 line-clamp-1">
                            {p.description}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-teal-900">
                        KES {p.priceKes.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {p.discountPct > 0 ? (
                          <span className="inline-flex items-center rounded bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5">
                            -{p.discountPct}%
                          </span>
                        ) : (
                          <span className="text-teal-900/30 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <form action={toggleTop5}>
                          <button
                            type="submit"
                            className={`text-lg leading-none transition ${p.isTop5 ? 'text-ochre-500 hover:text-ochre-600' : 'text-teal-900/20 hover:text-teal-900/40'}`}
                            title={p.isTop5 ? 'In Top-5' : 'Not in Top-5'}
                          >
                            ★
                          </button>
                        </form>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-teal-900/70 text-xs">
                        {p.soldCount}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${p.status === 'active' ? 'bg-teal-500/10 text-teal-700' : 'bg-sand-200 text-teal-900/50'}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/admin/shops/${shop.id}/products/${p.id}`}
                            className="text-xs font-semibold text-ochre-600 hover:text-ochre-500"
                          >
                            Edit
                          </Link>
                          <form action={del}>
                            <button
                              type="submit"
                              className="text-xs font-semibold text-terracotta-600 hover:text-terracotta-500"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ===== SETTINGS ===== */}
      <SectionCard
        id="settings"
        title="Settings"
        description="Slug, contact, payment and publication status."
      >
        <form action={settingsAction} className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Slug (subdomain)</Label>
            <input
              type="text"
              name="slug"
              defaultValue={shop.slug}
              className={`${inputClass} font-mono`}
              required
            />
            <p className="mt-1 text-[11px] text-terracotta-600/80">
              Changing this will break existing business cards and QR codes.
            </p>
          </div>
          <div>
            <Label>Title</Label>
            <input
              type="text"
              name="title"
              defaultValue={shop.title}
              className={inputClass}
              required
            />
          </div>
          <div className="md:col-span-2">
            <Label>Tagline</Label>
            <input
              type="text"
              name="tagline"
              defaultValue={shop.tagline ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <Label>Vendor phone</Label>
            <input
              type="text"
              name="vendorPhone"
              defaultValue={shop.vendorPhone}
              className={inputClass}
              required
            />
          </div>
          <div>
            <Label>M-Pesa number</Label>
            <input
              type="text"
              name="vendorMpesaNumber"
              defaultValue={shop.vendorMpesaNumber ?? ''}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Status</Label>
            <select
              name="status"
              defaultValue={shop.status}
              className={inputClass}
            >
              <option value="draft">Draft — not visible</option>
              <option value="live">Live — public</option>
              <option value="paused">Paused — frozen</option>
              <option value="archived">Archived — hidden</option>
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <SaveButton>Save settings</SaveButton>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
