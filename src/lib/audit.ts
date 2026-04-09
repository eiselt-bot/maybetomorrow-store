/**
 * Audit log helper — writes a row to the `audit_log` table for every
 * admin mutation. The table (schema.auditLog) already exists from
 * migration 0000; it just wasn't wired up until Phase 1 of the
 * production-readiness push.
 *
 * Usage from a server action:
 *   await logAudit({
 *     userId: session.user.id,
 *     action: 'shop.createProduct',
 *     entityType: 'product',
 *     entityId: createdProduct.id,
 *     meta: { shopId, name, priceKes },
 *   });
 *
 * The `meta` column is JSONB so you can drop arbitrary context in
 * there. Never log secrets — password hashes, API keys, session
 * tokens are all off-limits.
 */

import { db, schema } from '@/lib/db/client';

export type AuditEvent = {
  userId?: number | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  meta?: Record<string, unknown>;
};

/**
 * Append a row to `audit_log`. Swallows errors by design — audit
 * logging must NEVER block the actual user action. Failures go to
 * console.error for operator inspection.
 */
export async function logAudit(event: AuditEvent): Promise<void> {
  try {
    await db.insert(schema.auditLog).values({
      userId: event.userId ?? null,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId ?? null,
      meta: event.meta ?? null,
    });
  } catch (e) {
    console.error('[audit]', event.action, (e as Error).message);
  }
}
