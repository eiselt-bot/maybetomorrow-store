'use client';

/**
 * Route-segment error boundary.
 *
 * Catches render errors + async errors thrown by pages + layouts BELOW
 * the root layout. For errors in the root layout itself, see global-error.tsx.
 *
 * This is a recovery UI — the user sees a friendly message + a retry
 * button instead of the default unstyled error page.
 */

import { useEffect } from 'react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[root error boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-50 px-6">
      <div className="max-w-md w-full text-center">
        <p className="font-display text-6xl text-ochre-500 mb-2">oops</p>
        <h1 className="font-display text-2xl text-teal-900 mb-2">
          Something broke
        </h1>
        <p className="text-teal-900/70 text-sm mb-6">
          The page hit an unexpected error. The team has been notified.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={reset}
            className="inline-flex items-center rounded-lg bg-ochre-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ochre-600 transition"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center rounded-lg border border-teal-900/15 px-5 py-2.5 text-sm font-semibold text-teal-900 hover:border-ochre-500 hover:text-ochre-600 transition"
          >
            Back to landing
          </a>
        </div>
        {error.digest && (
          <p className="mt-6 text-[10px] text-teal-900/40 font-mono">
            ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
