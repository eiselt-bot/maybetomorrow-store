'use client';

/**
 * Per-shop error boundary. Renders inside the shop's chrome when
 * something in the product/checkout/cart pages throws.
 */

import { useEffect } from 'react';

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[shop error boundary]', error);
  }, [error]);

  return (
    <article className="max-w-2xl mx-auto px-6 py-20 text-center font-[var(--mt-font-body)]">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--mt-primary)] mb-2">
        Error
      </p>
      <h1 className="font-[var(--mt-font-display)] text-4xl md:text-5xl leading-tight mb-4">
        Something went wrong
      </h1>
      <p className="opacity-75 mb-8">
        We hit an unexpected error loading this page. Try again or head back
        to the shop.
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button
          onClick={reset}
          className="inline-flex items-center h-12 px-6 rounded-xl bg-[var(--mt-primary)] text-white font-semibold hover:opacity-90"
        >
          Try again
        </button>
      </div>
      {error.digest && (
        <p className="mt-6 text-[10px] opacity-40 font-mono">
          ref: {error.digest}
        </p>
      )}
    </article>
  );
}
