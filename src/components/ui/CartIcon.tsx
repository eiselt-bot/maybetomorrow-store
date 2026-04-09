'use client';

/**
 * CartIcon — header nav element that shows a live cart count for the
 * current shop (keyed by slug in localStorage as `mt-cart-${slug}`).
 *
 * The cart lives entirely in the browser: this avoids needing server
 * sessions for anonymous customers. On checkout, the full cart is
 * serialised into a hidden input and submitted to the server action.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Props = {
  slug: string;
};

type CartItem = {
  productId: number;
  qty: number;
  variantSize?: string;
  variantColor?: string;
};

export function CartIcon({ slug }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const key = `mt-cart-${slug}`;
    const read = () => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) {
          setCount(0);
          return;
        }
        const items = JSON.parse(raw) as CartItem[];
        const total = items.reduce((s, it) => s + (it.qty || 0), 0);
        setCount(total);
      } catch {
        setCount(0);
      }
    };
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) read();
    };
    const onLocal = () => read();
    window.addEventListener('storage', onStorage);
    window.addEventListener('mt-cart-updated', onLocal);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('mt-cart-updated', onLocal);
    };
  }, [slug]);

  return (
    <Link
      href={`/shop/${slug}/cart`}
      className="hover:text-[var(--mt-primary)] relative inline-flex items-center gap-1"
    >
      Cart
      {count !== null && count > 0 && (
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--mt-primary)] text-white text-[10px] font-bold">
          {count}
        </span>
      )}
    </Link>
  );
}
