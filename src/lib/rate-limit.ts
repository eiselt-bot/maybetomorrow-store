/**
 * In-memory rate limiter.
 *
 * A minimal sliding-window token bucket that lives in the Node process
 * memory. Good enough for mt-store's single-PM2-instance topology;
 * replace with Redis/Upstash when we go horizontal.
 *
 * Usage:
 *   const allowed = checkRateLimit(`ip:${ip}:upload`, 10, 60_000);
 *   if (!allowed) return NextResponse.json({ error: 'Rate limit' }, { status: 429 });
 */

type Bucket = { count: number; resetAt: number };

// Module-level map — survives for the lifetime of the Node process.
const buckets = new Map<string, Bucket>();

/**
 * Returns true if the request is allowed, false if the limit was exceeded.
 * Increments the counter for the key on every call that returns true.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}

/**
 * Returns the number of requests remaining in the current window for a key.
 * Does NOT increment. Useful for setting `X-RateLimit-Remaining` headers.
 */
export function peekRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    return { remaining: limit, resetAt: now + windowMs };
  }
  return { remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
}

/**
 * Derive a client identifier from a Next.js Request. Tries the standard
 * proxy headers first, falls back to a constant (which effectively
 * collapses everyone into one bucket — better than nothing for dev).
 */
export function clientKey(request: Request, suffix: string): string {
  const xff = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const ip = (xff?.split(',')[0] ?? real ?? 'unknown').trim();
  return `${ip}:${suffix}`;
}

// Periodic cleanup so buckets don't accumulate forever.
// unref() so this doesn't block Node shutdown.
if (typeof setInterval !== 'undefined') {
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }, 60_000);
  if (typeof interval === 'object' && interval && 'unref' in interval) {
    (interval as { unref: () => void }).unref();
  }
}
