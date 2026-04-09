/**
 * GET /api/health — liveness + readiness probe.
 *
 * Returns 200 when the app is healthy enough to serve traffic. Used by:
 *   - scripts/watchdog.sh on mahelya (curl every 5min, Telegram on fail)
 *   - nginx upstream health check (future)
 *   - manual smoke testing
 *
 * Checks:
 *   - db: can we execute a trivial SELECT against maybetomorrow DB
 *   - anthropic: is the API key configured (not called, just checked)
 *   - uploads: is UPLOAD_DIR present and writable
 *   - mem: current RSS
 *
 * Returns 503 if any critical check fails.
 */

import { NextResponse } from 'next/server';
import { existsSync, accessSync, constants as fsConstants } from 'node:fs';
import { db, schema } from '@/lib/db/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type CheckResult = { name: string; ok: boolean; detail?: string };

async function checkDb(): Promise<CheckResult> {
  try {
    await db.select({ id: schema.shops.id }).from(schema.shops).limit(1);
    return { name: 'db', ok: true };
  } catch (e) {
    return { name: 'db', ok: false, detail: (e as Error).message };
  }
}

function checkAnthropicKey(): CheckResult {
  const present = Boolean(process.env.ANTHROPIC_API_KEY?.length);
  return {
    name: 'anthropic_key',
    ok: present,
    detail: present ? undefined : 'ANTHROPIC_API_KEY not set',
  };
}

function checkUploads(): CheckResult {
  const dir = process.env.UPLOAD_DIR || '/var/mt-store/uploads';
  if (!existsSync(dir)) {
    return { name: 'uploads', ok: false, detail: `missing dir ${dir}` };
  }
  try {
    accessSync(dir, fsConstants.W_OK);
    return { name: 'uploads', ok: true };
  } catch {
    return { name: 'uploads', ok: false, detail: `not writable ${dir}` };
  }
}

function memInfo(): { rssMb: number; heapMb: number } {
  const m = process.memoryUsage();
  return {
    rssMb: Math.round(m.rss / 1024 / 1024),
    heapMb: Math.round(m.heapUsed / 1024 / 1024),
  };
}

export async function GET() {
  const [dbCheck, anthropicCheck, uploadsCheck] = await Promise.all([
    checkDb(),
    Promise.resolve(checkAnthropicKey()),
    Promise.resolve(checkUploads()),
  ]);

  const checks = [dbCheck, anthropicCheck, uploadsCheck];
  const allOk = checks.every((c) => c.ok);

  const body = {
    ok: allOk,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    mem: memInfo(),
    checks,
  };

  return NextResponse.json(body, {
    status: allOk ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
