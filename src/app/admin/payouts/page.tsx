import Link from 'next/link';
import { db, schema } from '@/lib/db/client';
import { eq, sql, isNull, isNotNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Admin payouts page.
 *
 * Reads the already-computed payout rows from the `payouts` table, plus
 * shows the OWED balance per shop (delivered orders NOT yet in a payout,
 * grouped by shop). Read-only for now.
 */
async function loadPayouts() {
  // Per-shop owed balance for delivered orders that are NOT yet in a payout
  const owed = await db
    .select({
      shopId: schema.orderItems.shopId,
      shopTitle: schema.shops.title,
      shopSlug: schema.shops.slug,
      owedKes: sql<number>`coalesce(sum(${schema.orderItems.lineTotalKes} - ${schema.orderItems.marginKes}), 0)::int`,
      orderCount: sql<number>`count(distinct ${schema.orderItems.orderId})::int`,
    })
    .from(schema.orderItems)
    .innerJoin(
      schema.orders,
      eq(schema.orders.id, schema.orderItems.orderId),
    )
    .leftJoin(schema.shops, eq(schema.shops.id, schema.orderItems.shopId))
    .leftJoin(schema.payouts, eq(schema.payouts.orderId, schema.orderItems.orderId))
    .where(
      sql`${schema.orders.status} = 'delivered' and ${schema.payouts.id} is null`,
    )
    .groupBy(
      schema.orderItems.shopId,
      schema.shops.title,
      schema.shops.slug,
    )
    .orderBy(sql`sum(${schema.orderItems.lineTotalKes}) desc nulls last`);

  const totalOwed = owed.reduce((s, r) => s + (r.owedKes ?? 0), 0);

  const history = await db
    .select({
      id: schema.payouts.id,
      shopId: schema.payouts.shopId,
      shopTitle: schema.shops.title,
      grossKes: schema.payouts.grossKes,
      marginKes: schema.payouts.marginKes,
      netKes: schema.payouts.netKes,
      mpesaRef: schema.payouts.mpesaRef,
      paidAt: schema.payouts.paidAt,
      createdAt: schema.payouts.createdAt,
      orderId: schema.payouts.orderId,
      orderNumber: schema.orders.orderNumber,
    })
    .from(schema.payouts)
    .leftJoin(schema.shops, eq(schema.shops.id, schema.payouts.shopId))
    .leftJoin(schema.orders, eq(schema.orders.id, schema.payouts.orderId))
    .orderBy(sql`${schema.payouts.createdAt} desc`)
    .limit(50);

  return { owed, totalOwed, history };
}

export default async function AdminPayoutsPage() {
  const data = await loadPayouts();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold tracking-widest uppercase text-ochre-600">
          Finance
        </p>
        <h1 className="font-display text-4xl text-teal-900 mt-1">Payouts</h1>
        <p className="mt-2 text-teal-900/60 text-sm">
          M-Pesa settlements to vendors. Owed = (line total − platform margin)
          for delivered orders not yet paid out.
        </p>
      </header>

      <div className="rounded-2xl border border-ochre-400/30 bg-gradient-to-br from-ochre-400/10 to-sand-50 p-6">
        <p className="text-xs tracking-widest uppercase text-ochre-600 font-semibold">
          Total outstanding
        </p>
        <p className="mt-2 font-display text-5xl text-teal-900 tabular-nums">
          KES {data.totalOwed.toLocaleString('en-KE')}
        </p>
        <p className="mt-2 text-xs text-teal-900/60">
          Across {data.owed.length} vendor{data.owed.length === 1 ? '' : 's'}
        </p>
      </div>

      <section>
        <h2 className="font-display text-2xl text-teal-900 mb-4">
          Balance per shop
        </h2>
        {data.owed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-teal-900/15 bg-sand-50 p-12 text-center">
            <p className="text-sm text-teal-900/50">
              Nothing to pay out yet. Balances will appear here once an order
              is marked &lsquo;delivered&rsquo;.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-teal-900/10 overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-sand-100 text-teal-900/70 text-[11px] tracking-wider uppercase">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Shop</th>
                  <th className="text-right font-semibold px-4 py-3">Delivered orders</th>
                  <th className="text-right font-semibold px-4 py-3">Owed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-900/5">
                {data.owed.map((r) => (
                  <tr key={r.shopId} className="hover:bg-sand-50/60 transition">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/shops/${r.shopId}`}
                        className="font-medium text-teal-900 hover:text-ochre-600"
                      >
                        {r.shopTitle ?? `shop #${r.shopId}`}
                      </Link>
                      <p className="text-[11px] text-teal-900/50 font-mono">
                        {r.shopSlug}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {r.orderCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-teal-900">
                      KES {r.owedKes.toLocaleString('en-KE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {data.history.length > 0 && (
        <section>
          <h2 className="font-display text-2xl text-teal-900 mb-4">
            Recent payout history
          </h2>
          <div className="rounded-2xl border border-teal-900/10 overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-sand-100 text-teal-900/70 text-[11px] tracking-wider uppercase">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Date</th>
                  <th className="text-left font-semibold px-4 py-3">Shop</th>
                  <th className="text-left font-semibold px-4 py-3">Order</th>
                  <th className="text-right font-semibold px-4 py-3">Net</th>
                  <th className="text-left font-semibold px-4 py-3">Paid</th>
                  <th className="text-left font-semibold px-4 py-3">M-Pesa ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-900/5">
                {data.history.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-xs text-teal-900/60">
                      {new Date(p.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3">{p.shopTitle ?? '—'}</td>
                    <td className="px-4 py-3 text-[11px] font-mono text-teal-900/70">
                      {p.orderNumber ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      KES {p.netKes.toLocaleString('en-KE')}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {p.paidAt ? (
                        <span className="text-green-600">
                          {new Date(p.paidAt).toLocaleDateString('en-GB')}
                        </span>
                      ) : (
                        <span className="text-ochre-600">pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-teal-900/50">
                      {p.mpesaRef ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
