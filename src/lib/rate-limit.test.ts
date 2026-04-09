/**
 * Unit tests for src/lib/rate-limit.ts
 *
 * Pure in-memory token bucket — no mocking needed. We just verify the
 * counting, window rollover, and peek behaviour.
 *
 * Module-level state: because buckets live in a module-scoped Map, each
 * test uses a unique key to avoid cross-contamination. Vitest's isolate
 * mode gives us a fresh module per file but not per test.
 */

import { describe, it, expect } from 'vitest';
import { checkRateLimit, peekRateLimit, clientKey } from './rate-limit';

describe('checkRateLimit', () => {
  it('allows the first request', () => {
    const ok = checkRateLimit('t1:first', 5, 60_000);
    expect(ok).toBe(true);
  });

  it('allows requests up to the limit', () => {
    const results = Array.from({ length: 5 }, () =>
      checkRateLimit('t1:count', 5, 60_000),
    );
    expect(results).toEqual([true, true, true, true, true]);
  });

  it('blocks the request that exceeds the limit', () => {
    // Exhaust the bucket
    for (let i = 0; i < 3; i++) checkRateLimit('t1:block', 3, 60_000);
    const blocked = checkRateLimit('t1:block', 3, 60_000);
    expect(blocked).toBe(false);
  });

  it('resets after the window elapses', async () => {
    // Window of 50ms so we can actually test rollover
    for (let i = 0; i < 2; i++) checkRateLimit('t1:window', 2, 50);
    expect(checkRateLimit('t1:window', 2, 50)).toBe(false);
    await new Promise((r) => setTimeout(r, 60));
    expect(checkRateLimit('t1:window', 2, 50)).toBe(true);
  });

  it('uses different buckets for different keys', () => {
    checkRateLimit('t1:a', 1, 60_000);
    checkRateLimit('t1:a', 1, 60_000);
    // 'a' is now exhausted; 'b' should still allow
    expect(checkRateLimit('t1:b', 1, 60_000)).toBe(true);
  });
});

describe('peekRateLimit', () => {
  it('returns full limit for an unused key', () => {
    const { remaining } = peekRateLimit('t2:unused', 10, 60_000);
    expect(remaining).toBe(10);
  });

  it('does not consume tokens', () => {
    // Use 3 tokens
    for (let i = 0; i < 3; i++) checkRateLimit('t2:peek', 10, 60_000);
    const before = peekRateLimit('t2:peek', 10, 60_000);
    const after = peekRateLimit('t2:peek', 10, 60_000);
    expect(before.remaining).toBe(7);
    expect(after.remaining).toBe(7);
  });

  it('returns 0 remaining when exhausted', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('t2:exhaust', 5, 60_000);
    expect(peekRateLimit('t2:exhaust', 5, 60_000).remaining).toBe(0);
  });
});

describe('clientKey', () => {
  it('prefers x-forwarded-for when present', () => {
    const req = new Request('http://localhost/', {
      headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' },
    });
    expect(clientKey(req, 'upload')).toBe('1.2.3.4:upload');
  });

  it('falls back to x-real-ip when no xff', () => {
    const req = new Request('http://localhost/', {
      headers: { 'x-real-ip': '5.6.7.8' },
    });
    expect(clientKey(req, 'api')).toBe('5.6.7.8:api');
  });

  it('falls back to "unknown" when no proxy headers', () => {
    const req = new Request('http://localhost/');
    expect(clientKey(req, 'test')).toBe('unknown:test');
  });

  it('appends the suffix', () => {
    const req = new Request('http://localhost/', {
      headers: { 'x-forwarded-for': '9.9.9.9' },
    });
    expect(clientKey(req, 'foo')).toBe('9.9.9.9:foo');
    expect(clientKey(req, 'bar')).toBe('9.9.9.9:bar');
  });
});
