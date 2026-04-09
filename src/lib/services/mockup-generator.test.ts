/**
 * Unit tests for src/lib/services/mockup-generator.ts
 *
 * We mock @anthropic-ai/sdk so tests run without hitting the real API.
 * The interesting surface is:
 *   - JSON parsing from a fenced Claude response (```json ... ```)
 *   - Zod-like validation of each variant (hex colors, allowed enums)
 *   - Error path when the response is missing / malformed
 *   - Error path when a variant has invalid fields
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so the mock variable survives vi.mock's hoisting to
// the top of the file. Reference from tests via `mocks.create`.
const mocks = vi.hoisted(() => ({
  create: vi.fn(),
}));

// Mock Anthropic SDK — the SDK is instantiated via `new Anthropic({apiKey})`,
// so our mock default export must be a constructable class.
vi.mock('@anthropic-ai/sdk', () => {
  class Anthropic {
    messages = { create: mocks.create };
  }
  return { default: Anthropic };
});

import { generateMockups } from './mockup-generator';
import type { Shop } from '@/lib/db/schema';

const shopFixture: Partial<Shop> = {
  id: 1,
  slug: 'test-shop',
  title: 'Test Shop',
  tagline: 'Handmade samples',
  aboutOffering: 'Sample products for unit tests',
  aboutPurpose: 'Test the generator',
  aboutProduction: null,
  layoutVariant: 'earthy-artisan',
  designTokens: {
    primary: '#c87a1f',
    secondary: '#0f7080',
    accent: '#d99543',
    font_display: 'Fraunces',
    font_body: 'Inter',
    radius: 'md',
    hero_treatment: 'warm-overlay',
  },
};

function makeResponse(text: string) {
  return { content: [{ type: 'text', text }] };
}

function validVariant(i: number) {
  const primaries = ['#1a2b3c', '#4d5e6f', '#7a8b9c'];
  const layouts = ['ocean-calm', 'earthy-artisan', 'heritage-story'];
  return {
    name: `Variant ${i}`,
    rationale: `Leans into the first brand value with approach ${i}`,
    layout_variant: layouts[i - 1],
    design_tokens: {
      primary: primaries[i - 1],
      secondary: '#ffffff',
      accent: '#000000',
      font_display: 'Fraunces',
      font_body: 'Inter',
      radius: 'md',
      hero_treatment: 'warm-overlay',
    },
    copy_tone: `Tone number ${i}`,
  };
}

describe('generateMockups', () => {
  beforeEach(() => {
    mocks.create.mockReset();
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
  });

  it('parses a plain-JSON response with 3 valid variants', async () => {
    const variants = [1, 2, 3].map(validVariant);
    mocks.create.mockResolvedValue(
      makeResponse(JSON.stringify({ variants })),
    );

    const result = await generateMockups(shopFixture as Shop, [
      'Craft',
      'Flow',
      'Voice',
    ]);

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Variant 1');
    expect(result[0].layout_variant).toBe('ocean-calm');
    expect(result[1].design_tokens.primary).toBe('#4d5e6f');
    expect(result[2].copy_tone).toBe('Tone number 3');
  });

  it('strips markdown fences from the response', async () => {
    const variants = [1, 2, 3].map(validVariant);
    const fenced = '```json\n' + JSON.stringify({ variants }) + '\n```';
    mocks.create.mockResolvedValue(makeResponse(fenced));

    const result = await generateMockups(shopFixture as Shop, ['One']);
    expect(result).toHaveLength(3);
  });

  it('strips leading commentary + fences', async () => {
    const variants = [1, 2, 3].map(validVariant);
    const text = `Here are three mockups for your shop:\n\n\`\`\`json\n${JSON.stringify({ variants })}\n\`\`\`\n\nLet me know!`;
    mocks.create.mockResolvedValue(makeResponse(text));

    const result = await generateMockups(shopFixture as Shop, ['One']);
    expect(result).toHaveLength(3);
  });

  it('rejects when ANTHROPIC_API_KEY is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(
      generateMockups(shopFixture as Shop, ['One']),
    ).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });

  it('rejects when brand values are empty', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test';
    await expect(
      generateMockups(shopFixture as Shop, ['', '  ', null as unknown as string]),
    ).rejects.toThrow(/brand value/i);
  });

  it('rejects when the response has fewer than 3 variants', async () => {
    mocks.create.mockResolvedValue(
      makeResponse(
        JSON.stringify({
          variants: [validVariant(1), validVariant(2)],
        }),
      ),
    );
    await expect(
      generateMockups(shopFixture as Shop, ['One']),
    ).rejects.toThrow(/3 variants/);
  });

  it('rejects a variant with an invalid hex color', async () => {
    const bad = validVariant(1);
    bad.design_tokens.primary = 'not-a-color';
    const variants = [bad, validVariant(2), validVariant(3)];
    mocks.create.mockResolvedValue(makeResponse(JSON.stringify({ variants })));

    await expect(
      generateMockups(shopFixture as Shop, ['One']),
    ).rejects.toThrow(/invalid color/);
  });

  it('rejects a variant with an unknown layout_variant', async () => {
    const bad = validVariant(1);
    bad.layout_variant = 'martian-vibes';
    const variants = [bad, validVariant(2), validVariant(3)];
    mocks.create.mockResolvedValue(makeResponse(JSON.stringify({ variants })));

    await expect(
      generateMockups(shopFixture as Shop, ['One']),
    ).rejects.toThrow(/invalid layout_variant/);
  });

  it('rejects a variant with an invalid radius', async () => {
    const bad = validVariant(1);
    (bad.design_tokens as { radius: string }).radius = 'huge';
    const variants = [bad, validVariant(2), validVariant(3)];
    mocks.create.mockResolvedValue(makeResponse(JSON.stringify({ variants })));

    await expect(
      generateMockups(shopFixture as Shop, ['One']),
    ).rejects.toThrow(/invalid radius/);
  });

  it('rejects when Claude returns no text block', async () => {
    mocks.create.mockResolvedValue({
      content: [{ type: 'tool_use', id: 'abc' }],
    });
    await expect(
      generateMockups(shopFixture as Shop, ['One']),
    ).rejects.toThrow(/No text/);
  });

  it('rejects when the JSON is garbage', async () => {
    mocks.create.mockResolvedValue(makeResponse('not even json {{'));
    await expect(
      generateMockups(shopFixture as Shop, ['One']),
    ).rejects.toThrow(/No JSON object found/);
  });
});
