/**
 * Mockup Generator — calls Claude Haiku to produce 3 distinct design
 * interpretations for a shop based on its ranked brand values.
 *
 * Returns MockupVariant[] with exactly 3 items; each variant has a layout
 * variant, full design tokens, a short name, a rationale, and a copy tone.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Shop, LayoutVariant } from '@/lib/db/schema';

export type MockupDesignTokens = {
  primary: string;
  secondary: string;
  accent: string;
  font_display: string;
  font_body: string;
  radius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hero_treatment: 'warm-overlay' | 'cool-overlay' | 'polaroid' | 'clean' | 'pattern-bg';
};

export type MockupVariant = {
  name: string;
  rationale: string;
  layout_variant: LayoutVariant;
  design_tokens: MockupDesignTokens;
  copy_tone: string;
};

const ALLOWED_LAYOUTS: LayoutVariant[] = [
  'earthy-artisan',
  'vibrant-market',
  'ocean-calm',
  'heritage-story',
  'bold-maker',
];
const ALLOWED_RADIUS = ['none', 'sm', 'md', 'lg', 'xl'] as const;
const ALLOWED_HERO = [
  'warm-overlay',
  'cool-overlay',
  'polaroid',
  'clean',
  'pattern-bg',
] as const;

function assertVariant(v: unknown, idx: number): MockupVariant {
  if (!v || typeof v !== 'object') {
    throw new Error(`Variant ${idx}: not an object`);
  }
  const o = v as Record<string, unknown>;
  const tokens = o.design_tokens as Record<string, unknown> | undefined;
  if (!tokens) throw new Error(`Variant ${idx}: missing design_tokens`);

  const hex = /^#[0-9a-fA-F]{3,8}$/;
  const check = (k: string, val: unknown) => {
    if (typeof val !== 'string' || !hex.test(val)) {
      throw new Error(`Variant ${idx}: invalid color ${k}: ${String(val)}`);
    }
  };
  check('primary', tokens.primary);
  check('secondary', tokens.secondary);
  check('accent', tokens.accent);

  if (
    typeof tokens.font_display !== 'string' ||
    typeof tokens.font_body !== 'string'
  ) {
    throw new Error(`Variant ${idx}: invalid fonts`);
  }
  if (!ALLOWED_RADIUS.includes(tokens.radius as (typeof ALLOWED_RADIUS)[number])) {
    throw new Error(`Variant ${idx}: invalid radius: ${String(tokens.radius)}`);
  }
  if (
    !ALLOWED_HERO.includes(tokens.hero_treatment as (typeof ALLOWED_HERO)[number])
  ) {
    throw new Error(
      `Variant ${idx}: invalid hero_treatment: ${String(tokens.hero_treatment)}`,
    );
  }
  if (!ALLOWED_LAYOUTS.includes(o.layout_variant as LayoutVariant)) {
    throw new Error(
      `Variant ${idx}: invalid layout_variant: ${String(o.layout_variant)}`,
    );
  }
  if (typeof o.name !== 'string' || o.name.length === 0) {
    throw new Error(`Variant ${idx}: invalid name`);
  }
  if (typeof o.rationale !== 'string' || o.rationale.length === 0) {
    throw new Error(`Variant ${idx}: invalid rationale`);
  }
  if (typeof o.copy_tone !== 'string' || o.copy_tone.length === 0) {
    throw new Error(`Variant ${idx}: invalid copy_tone`);
  }

  return {
    name: o.name,
    rationale: o.rationale,
    layout_variant: o.layout_variant as LayoutVariant,
    design_tokens: {
      primary: tokens.primary as string,
      secondary: tokens.secondary as string,
      accent: tokens.accent as string,
      font_display: tokens.font_display,
      font_body: tokens.font_body,
      radius: tokens.radius as (typeof ALLOWED_RADIUS)[number],
      hero_treatment: tokens.hero_treatment as (typeof ALLOWED_HERO)[number],
    },
    copy_tone: o.copy_tone,
  };
}

export async function generateMockups(
  shop: Shop,
  brandValues: string[],
): Promise<MockupVariant[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured on the server');
  }
  const values = brandValues.filter((v) => v && v.trim().length > 0);
  if (values.length === 0) {
    throw new Error('At least one brand value is required');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = `You are a senior brand designer. Given a shop's name, story, and ranked brand values, you generate 3 DISTINCT design mockups. Each mockup interprets the same brand values through a different aesthetic lens, picking from 5 predefined layout variants and tuning design tokens.

Available layout_variant values (pick one per mockup — the 3 variants should use DIFFERENT layouts whenever possible):
- earthy-artisan: Warm terracotta, linen, handwritten. For makers carrying products from a studio.
- vibrant-market: Kitenge colors, bold contrasts, market-stall energy. For shops with many SKUs.
- ocean-calm: Soft teals, coral hints, whitespace. Diani-beach aesthetic.
- heritage-story: Serif display, big photography, documentary. For family-tradition shops.
- bold-maker: Massive type, strong grids, gallery-contemporary. For statement brands.

Return STRICT JSON (no markdown, no commentary) with key "variants" containing exactly 3 objects. Each variant MUST have:
{
  "name": "short memorable title, 2-4 words, e.g. 'Indigo Tide' or 'Coastal Heritage'",
  "rationale": "one sentence explaining how this mockup interprets the brand values and which values it leans into most",
  "layout_variant": "one of: earthy-artisan | vibrant-market | ocean-calm | heritage-story | bold-maker",
  "design_tokens": {
    "primary":    "#RRGGBB (hex)",
    "secondary":  "#RRGGBB (hex)",
    "accent":     "#RRGGBB (hex)",
    "font_display": "Google Font name for headings, e.g. 'Fraunces', 'Playfair Display', 'Archivo Black'",
    "font_body":    "Google Font name for body, e.g. 'Inter', 'Work Sans', 'DM Sans'",
    "radius": "one of: none | sm | md | lg | xl",
    "hero_treatment": "one of: warm-overlay | cool-overlay | polaroid | clean | pattern-bg"
  },
  "copy_tone": "one sentence copywriting direction, poetic, e.g. 'Soft, tidal, unhurried — like a breeze through a kanga line at noon.'"
}

Hard constraints:
- Earlier ranked brand values carry MORE weight in the design direction.
- All 3 mockups must be visibly different from each other.
- Colors must be valid 6-digit hex values (#RRGGBB).
- Font names must be real Google Fonts.
- Output ONLY the JSON object — no prose before or after.`;

  const userPrompt = `Shop: ${shop.title} (${shop.slug})
${shop.tagline ? `Tagline: ${shop.tagline}\n` : ''}${shop.aboutOffering ? `What they sell: ${shop.aboutOffering}\n` : ''}${shop.aboutPurpose ? `Why they do it: ${shop.aboutPurpose}\n` : ''}${shop.aboutProduction ? `How they make it: ${shop.aboutProduction}\n` : ''}
Ranked brand values (most important first):
${values.map((v, i) => `  ${i + 1}. ${v}`).join('\n')}

Current layout variant: ${shop.layoutVariant ?? 'none'}
Current primary color: ${shop.designTokens?.primary ?? 'none'}

Generate 3 distinct mockup interpretations now. Return ONLY valid JSON.`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2500,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text block in Claude response');
  }

  const raw = textBlock.text.trim();
  const jsonStart = raw.indexOf('{');
  const jsonEnd = raw.lastIndexOf('}');
  if (jsonStart < 0 || jsonEnd < 0) {
    throw new Error(`No JSON object found in response: ${raw.slice(0, 200)}`);
  }

  let parsed: { variants?: unknown[] };
  try {
    parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
  } catch (e) {
    throw new Error(`JSON parse failed: ${(e as Error).message}`);
  }

  if (!Array.isArray(parsed.variants) || parsed.variants.length !== 3) {
    throw new Error(
      `Expected 3 variants, got ${Array.isArray(parsed.variants) ? parsed.variants.length : 'not-array'}`,
    );
  }

  return parsed.variants.map((v, i) => assertVariant(v, i + 1));
}
