import Link from 'next/link';
import { db, schema } from '@/lib/db/client';
import { desc, sql, eq, isNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function loadIncidents() {
  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      yellow: sql<number>`count(*) filter (where severity = 'yellow')::int`,
      red: sql<number>`count(*) filter (where severity = 'red')::int`,
      openYellow: sql<number>`count(*) filter (where severity = 'yellow' and resolution_notes is null)::int`,
    })
    .from(schema.incidentCards);

  const list = await db
    .select({
      id: schema.incidentCards.id,
      severity: schema.incidentCards.severity,
      subjectType: schema.incidentCards.subjectType,
      subjectId: schema.incidentCards.subjectId,
      rootCause: schema.incidentCards.rootCause,
      description: schema.incidentCards.description,
      resolutionNotes: schema.incidentCards.resolutionNotes,
      settlementKes: schema.incidentCards.settlementKes,
      createdAt: schema.incidentCards.createdAt,
      orderId: schema.incidentCards.orderId,
      orderNumber: schema.orders.orderNumber,
      orderShopId: schema.orders.initialShopId,
    })
    .from(schema.incidentCards)
    .leftJoin(schema.orders, eq(schema.orders.id, schema.incidentCards.orderId))
    .orderBy(desc(schema.incidentCards.createdAt))
    .limit(100);

  return { counts, list };
}

export default async function AdminIncidentsPage() {
  const data = await loadIncidents();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold tracking-widest uppercase text-ochre-600">
          Trust &amp; Safety
        </p>
        <h1 className="font-display text-4xl text-teal-900 mt-1">Incidents</h1>
        <p className="mt-2 text-teal-900/60 text-sm">
          Yellow and red cards for vendors and drivers. Three yellow cards in
          90 days = automatic red.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-ochre-400/30 bg-ochre-400/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ochre-600">
            Yellow cards
          </p>
          <p className="mt-2 font-display text-5xl text-teal-900 tabular-nums">
            {data.counts?.yellow ?? 0}
          </p>
          <p className="mt-2 text-xs text-teal-900/50">
            {data.counts?.openYellow ?? 0} open · first warnings
          </p>
        </div>
        <div className="rounded-2xl border border-terracotta-500/30 bg-terracotta-500/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-terracotta-600">
            Red cards
          </p>
          <p className="mt-2 font-display text-5xl text-teal-900 tabular-nums">
            {data.counts?.red ?? 0}
          </p>
          <p className="mt-2 text-xs text-teal-900/50">Removed from platform</p>
        </div>
        <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Total
          </p>
          <p className="mt-2 font-display text-5xl text-teal-900 tabular-nums">
            {data.counts?.total ?? 0}
          </p>
          <p className="mt-2 text-xs text-teal-900/50">Lifetime incidents</p>
        </div>
      </div>

      {data.list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-teal-900/15 bg-sand-50 p-12 text-center">
          <p className="font-display text-xl text-teal-900">No incidents yet</p>
          <p className="mt-2 text-sm text-teal-900/50 max-w-sm mx-auto">
            That&apos;s the best kind of empty page. Incidents get logged when
            a vendor or driver misses a delivery, breaks an item, or behaves
            badly.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-teal-900/10 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-sand-100 text-teal-900/70 text-[11px] tracking-wider uppercase">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Date</th>
                <th className="text-left font-semibold px-4 py-3">Severity</th>
                <th className="text-left font-semibold px-4 py-3">Subject</th>
                <th className="text-left font-semibold px-4 py-3">Order</th>
                <th className="text-left font-semibold px-4 py-3">Root cause</th>
                <th className="text-right font-semibold px-4 py-3">Settlement</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-900/5">
              {data.list.map((i) => (
                <tr key={i.id} className="hover:bg-sand-50/60 transition">
                  <td className="px-4 py-3 text-xs text-teal-900/60">
                    {new Date(i.createdAt).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${
                        i.severity === 'red'
                          ? 'bg-terracotta-500/15 text-terracotta-600 border-terracotta-500/30'
                          : 'bg-ochre-400/15 text-ochre-700 border-ochre-400/30'
                      }`}
                    >
                      {i.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-teal-900/70 text-xs">
                    {i.subjectType} #{i.subjectId}
                  </td>
                  <td className="px-4 py-3">
                    {i.orderNumber ? (
                      <Link
                        href={`/admin/orders/${i.orderNumber}`}
                        className="text-[11px] font-mono text-teal-900 hover:text-ochre-600"
                      >
                        {i.orderNumber}
                      </Link>
                    ) : (
                      <span className="text-teal-900/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-teal-900/70 capitalize">
                    {i.rootCause.replace(/-/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                    {i.settlementKes && i.settlementKes > 0
                      ? `KES ${i.settlementKes.toLocaleString('en-KE')}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {i.resolutionNotes ? (
                      <span className="text-green-600">Resolved</span>
                    ) : (
                      <span className="text-ochre-600">Open</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
