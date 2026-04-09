import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, schema } from '@/lib/db/client';
import { eq } from 'drizzle-orm';
import {
  updateLayoutVariantForm,
  updateDesignTokensForm,
} from '@/app/actions/shop-admin';
import type { LayoutVariant } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

// ============================================================================
// Layout catalog — visual preview via gradient blocks
// ============================================================================

type VariantMeta = {
  value: LayoutVariant;
  label: string;
  mood: string;
  description: string;
  swatches: string[];
  preview: { bg: string; heading: string; sub: string };
};

const VARIANTS: VariantMeta[] = [
  {
    value: 'earthy-artisan',
    label: 'Earthy Artisan',
    mood: 'Warm, grounded, human-made',
    description:
      'Terracotta walls, linen paper, hand-written labels. For makers whose products feel carried home from a studio.',
    swatches: ['#c87a1f', '#b8451f', '#efe0bf', '#2b1d10'],
    preview: {
      bg: 'linear-gradient(135deg, #c87a1f, #b8451f)',
      heading: 'text-white',
      sub: 'text-white/70',
    },
  },
  {
    value: 'vibrant-market',
    label: 'Vibrant Market',
    mood: 'Energetic, saturated, bustling',
    description:
      'Kitenge colors, bold contrasts, market-stall energy. Best for shops with dozens of SKUs who want noise.',
    swatches: ['#ff6b35', '#f7c548', '#005577', '#ffffff'],
    preview: {
      bg: 'linear-gradient(135deg, #ff6b35, #f7c548)',
      heading: 'text-white',
      sub: 'text-white/80',
    },
  },
  {
    value: 'ocean-calm',
    label: 'Ocean Calm',
    mood: 'Breezy, light, coastal',
    description:
      'Soft teals, coral hints, lots of whitespace. Diani-beach aesthetic — for shops next to the sea.',
    swatches: ['#0f7080', '#8ec8d0', '#fdf9f2', '#c87a1f'],
    preview: {
      bg: 'linear-gradient(135deg, #0f7080, #8ec8d0)',
      heading: 'text-white',
      sub: 'text-white/80',
    },
  },
  {
    value: 'heritage-story',
    label: 'Heritage Story',
    mood: 'Editorial, documentary, timeless',
    description:
      'Serif display, big photography, three-generation narrative. For shops rooted in a long family tradition.',
    swatches: ['#3e2723', '#8d6e63', '#efe0bf', '#c87a1f'],
    preview: {
      bg: 'linear-gradient(135deg, #3e2723, #8d6e63)',
      heading: 'text-white',
      sub: 'text-white/70',
    },
  },
  {
    value: 'bold-maker',
    label: 'Bold Maker',
    mood: 'Confident, graphic, statement',
    description:
      'Massive type, strong grids, accent pops. For contemporary brands that want to look like they belong in a gallery.',
    swatches: ['#1a1410', '#d99543', '#fdf9f2', '#b8451f'],
    preview: {
      bg: 'linear-gradient(135deg, #1a1410, #d99543)',
      heading: 'text-white',
      sub: 'text-white/80',
    },
  },
];

async function loadShop(id: number) {
  const [shop] = await db
    .select()
    .from(schema.shops)
    .where(eq(schema.shops.id, id))
    .limit(1);
  return shop ?? null;
}

const DEFAULTS = {
  primary: '#c87a1f',
  secondary: '#0f7080',
  accent: '#d99543',
  font_display: 'Fraunces',
  font_body: 'Inter',
  radius: 'md' as const,
  hero_treatment: 'warm-overlay' as const,
};

const inputClass =
  'w-full rounded-lg border border-teal-900/15 bg-white px-3 py-2 text-sm text-teal-900 placeholder:text-teal-900/30 focus:border-ochre-500 focus:outline-none focus:ring-2 focus:ring-ochre-400/30 transition';

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold tracking-widest uppercase text-teal-900/60 mb-1.5">
      {children}
    </label>
  );
}

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const shop = await loadShop(id);
  if (!shop) notFound();

  const tokens = { ...DEFAULTS, ...(shop.designTokens ?? {}) };
  const currentVariant = (shop.layoutVariant ?? 'earthy-artisan') as LayoutVariant;

  const layoutAction = updateLayoutVariantForm.bind(null, shop.id);
  const tokensAction = updateDesignTokensForm.bind(null, shop.id);

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
          Template & Design
        </h1>
        <p className="mt-2 text-sm text-teal-900/60 max-w-2xl">
          Pick one of five curated layouts and fine-tune the design tokens.
          Changes apply instantly to the public shop.
        </p>
      </div>

      {/* Layout picker */}
      <section className="rounded-2xl border border-teal-900/10 bg-white shadow-sm">
        <div className="px-6 pt-6 pb-4 border-b border-teal-900/5">
          <h2 className="font-display text-2xl text-teal-900">Layout variant</h2>
          <p className="mt-1 text-sm text-teal-900/60">
            Click a card to select, then press save.
          </p>
        </div>
        <div className="p-6">
          <form action={layoutAction}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {VARIANTS.map((v) => {
                const selected = v.value === currentVariant;
                return (
                  <label
                    key={v.value}
                    className={`relative cursor-pointer rounded-2xl border-2 overflow-hidden transition hover:shadow-lg ${
                      selected
                        ? 'border-ochre-500 ring-4 ring-ochre-400/30'
                        : 'border-teal-900/10 hover:border-ochre-400/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="layoutVariant"
                      value={v.value}
                      defaultChecked={selected}
                      className="sr-only"
                    />

                    {/* Preview hero */}
                    <div
                      className="h-36 p-4 flex flex-col justify-end relative"
                      style={{ background: v.preview.bg }}
                    >
                      {selected && (
                        <span className="absolute top-3 right-3 bg-white text-ochre-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow">
                          Current
                        </span>
                      )}
                      <p className={`font-display text-2xl ${v.preview.heading}`}>
                        {v.label}
                      </p>
                      <p className={`text-xs ${v.preview.sub}`}>{v.mood}</p>
                    </div>

                    {/* Body */}
                    <div className="p-4 bg-white">
                      <p className="text-xs text-teal-900/70 leading-snug">
                        {v.description}
                      </p>
                      <div className="mt-3 flex items-center gap-1.5">
                        {v.swatches.map((c) => (
                          <span
                            key={c}
                            className="w-5 h-5 rounded-full border border-black/10"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center rounded-lg bg-ochre-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-ochre-600 transition"
              >
                Apply layout
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Design tokens */}
      <section className="rounded-2xl border border-teal-900/10 bg-white shadow-sm">
        <div className="px-6 pt-6 pb-4 border-b border-teal-900/5">
          <h2 className="font-display text-2xl text-teal-900">Design tokens</h2>
          <p className="mt-1 text-sm text-teal-900/60">
            Colors, typography, radius and hero treatment. These override the
            layout defaults.
          </p>
        </div>
        <div className="p-6">
          {/* Live swatch preview */}
          <div className="mb-5 rounded-xl border border-teal-900/10 p-4 flex items-center gap-4 bg-sand-50">
            <div
              className="w-14 h-14 rounded-lg shadow-sm"
              style={{ backgroundColor: tokens.primary }}
              title="Primary"
            />
            <div
              className="w-14 h-14 rounded-lg shadow-sm"
              style={{ backgroundColor: tokens.secondary }}
              title="Secondary"
            />
            <div
              className="w-14 h-14 rounded-lg shadow-sm"
              style={{ backgroundColor: tokens.accent }}
              title="Accent"
            />
            <div className="flex-1 min-w-0">
              <p className="font-display text-xl text-teal-900 truncate">
                {tokens.font_display} / {tokens.font_body}
              </p>
              <p className="text-[11px] text-teal-900/50">
                Radius: {tokens.radius} · Hero: {tokens.hero_treatment}
              </p>
            </div>
          </div>

          <form action={tokensAction} className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Primary</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="primary"
                  defaultValue={tokens.primary}
                  className="h-11 w-16 cursor-pointer rounded border border-teal-900/15"
                />
                <code className="text-xs font-mono text-teal-900/60">
                  {tokens.primary}
                </code>
              </div>
            </div>
            <div>
              <Label>Secondary</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="secondary"
                  defaultValue={tokens.secondary}
                  className="h-11 w-16 cursor-pointer rounded border border-teal-900/15"
                />
                <code className="text-xs font-mono text-teal-900/60">
                  {tokens.secondary}
                </code>
              </div>
            </div>
            <div>
              <Label>Accent</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="accent"
                  defaultValue={tokens.accent}
                  className="h-11 w-16 cursor-pointer rounded border border-teal-900/15"
                />
                <code className="text-xs font-mono text-teal-900/60">
                  {tokens.accent}
                </code>
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
                <option value="none">None</option>
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
                <option value="polaroid">Polaroid frame</option>
                <option value="clean">Clean (no overlay)</option>
                <option value="pattern-bg">Pattern background</option>
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center rounded-lg bg-ochre-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-ochre-600 transition"
              >
                Save tokens
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
