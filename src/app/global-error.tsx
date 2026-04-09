'use client';

/**
 * Last-resort error boundary. Catches errors thrown FROM the root
 * layout itself — at this point the app's <html> / <body> / fonts
 * haven't rendered, so we render a fully self-contained page here.
 *
 * Keep dependencies at zero. Don't import anything from the app,
 * don't use Tailwind utility classes (they may not be available if
 * the CSS bundle failed to load).
 */

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fdf9f2',
          color: '#1a2e2a',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '2rem',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
          <p
            style={{
              fontSize: '3.5rem',
              color: '#c87a1f',
              margin: 0,
              fontFamily: 'Georgia, serif',
            }}
          >
            oops
          </p>
          <h1 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>
            Something broke
          </h1>
          <p style={{ color: 'rgba(26,46,42,0.7)', fontSize: '0.9rem' }}>
            The app hit a fatal error. Try reloading.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              background: '#c87a1f',
              color: 'white',
              border: 0,
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
          {error.digest && (
            <p
              style={{
                marginTop: '1.5rem',
                fontSize: '0.7rem',
                color: 'rgba(26,46,42,0.4)',
                fontFamily: 'monospace',
              }}
            >
              ref: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
