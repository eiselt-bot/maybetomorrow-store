'use client';

/**
 * AddToCartButton — client component that lives on the product detail
 * page. Writes { productId, qty, variantSize?, variantColor? } into
 * `mt-cart-${slug}` in localStorage, merges with existing lines that
 * share the exact same (productId, variant) identity, and dispatches
 * a `mt-cart-updated` window event so the header CartIcon re-reads.
 *
 * Shows a short inline confirmation ("Added to cart · View cart →")
 * and resets after a few seconds.
 */

import Link from 'next/link';
import { useState } from 'react';

type Props = {
  slug: string;
  productId: number;
  sizes: string | null;
  colors: string | null;
  className?: string;
};

type CartItem = {
  productId: number;
  qty: number;
  variantSize?: string;
  variantColor?: string;
};

export function AddToCartButton({
  slug,
  productId,
  sizes,
  colors,
  className,
}: Props) {
  const sizeOptions = (sizes ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const colorOptions = (colors ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addToCart() {
    setError(null);
    if (sizeOptions.length > 0 && !size) {
      setError('Please pick a size');
      return;
    }
    if (colorOptions.length > 0 && !color) {
      setError('Please pick a color');
      return;
    }

    const key = `mt-cart-${slug}`;
    let existing: CartItem[] = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) existing = JSON.parse(raw) as CartItem[];
    } catch {}

    const newItem: CartItem = { productId, qty };
    if (size) newItem.variantSize = size;
    if (color) newItem.variantColor = color;

    // Merge with exact same (productId, size, color) line
    const matchIdx = existing.findIndex(
      (it) =>
        it.productId === productId &&
        (it.variantSize ?? '') === (newItem.variantSize ?? '') &&
        (it.variantColor ?? '') === (newItem.variantColor ?? ''),
    );
    if (matchIdx >= 0) {
      existing[matchIdx].qty += qty;
    } else {
      existing.push(newItem);
    }

    localStorage.setItem(key, JSON.stringify(existing));
    window.dispatchEvent(new Event('mt-cart-updated'));
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 3500);
  }

  return (
    <div className={className}>
      {(sizeOptions.length > 0 || colorOptions.length > 0) && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {sizeOptions.length > 0 && (
            <div>
              <label className="block text-xs uppercase tracking-wider opacity-70 mb-1.5">
                Size
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full h-11 px-3 rounded-md border border-black/20 bg-white"
              >
                <option value="">Pick one</option>
                {sizeOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
          {colorOptions.length > 0 && (
            <div>
              <label className="block text-xs uppercase tracking-wider opacity-70 mb-1.5">
                Color
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-11 px-3 rounded-md border border-black/20 bg-white"
              >
                <option value="">Pick one</option>
                {colorOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center border border-black/20 rounded-md h-12 overflow-hidden">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-10 h-full hover:bg-black/5 text-lg"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 text-center font-semibold tabular-nums">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(50, q + 1))}
            className="w-10 h-full hover:bg-black/5 text-lg"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={addToCart}
          className="flex-1 sm:flex-none h-12 px-8 rounded-xl bg-[var(--mt-primary)] text-white font-semibold text-base hover:opacity-90 transition"
        >
          Add to cart
        </button>

        <Link
          href={`/shop/${slug}/cart`}
          className="h-12 px-5 inline-flex items-center rounded-xl border-2 border-[var(--mt-primary)] text-[var(--mt-primary)] font-semibold hover:bg-[var(--mt-primary)] hover:text-white transition"
        >
          View cart
        </Link>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
      {justAdded && !error && (
        <p className="mt-3 text-sm text-[var(--mt-primary)] font-semibold">
          ✓ Added to cart.{' '}
          <Link href={`/shop/${slug}/cart`} className="underline">
            View cart →
          </Link>
        </p>
      )}
    </div>
  );
}
