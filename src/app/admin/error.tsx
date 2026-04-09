'use client';

/**
 * Admin segment error boundary.
 *
 * Catches errors in any /admin/** route. Shows an admin-styled error
 * page with a direct link back to /admin so the operator can recover
 * without losing their place.
 */

import Link from 'next/link';
import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin error boundary]', error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
      <p className="font-display text-4xl text-red-600 mb-2">Admin error</p>
      <p className="text-sm text-red-800 mb-6 max-w-md mx-auto">
        {error.message || 'An unexpected error occurred in the admin panel.'}
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button
          onClick={reset}
          className="inline-flex items-center rounded-lg bg-ochre-500 px-4 py-2 text-sm font-semibold text-white hover:bg-ochre-600 transition"
        >
          Retry
        </button>
        <Link
          href="/admin"
          className="inline-flex items-center rounded-lg border border-teal-900/15 bg-white px-4 py-2 text-sm font-semibold text-teal-900 hover:border-ochre-500 hover:text-ochre-600 transition"
        >
          ← Dashboard
        </Link>
      </div>
      {error.digest && (
        <p className="mt-5 text-[10px] text-teal-900/40 font-mono">
          ref: {error.digest}
        </p>
      )}
    </div>
  );
}
