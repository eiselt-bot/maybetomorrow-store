import Link from 'next/link';
import { db, schema } from '@/lib/db/client';
import { eq, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type Row = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: string;
  totalKes: number;
  deliveryZone: string;
  deliveryDate: string;
  createdAt: Date;
  shopTitle: string | null;
  shopSlug: string | null;
  itemCount: number;
};

async function loadOrders(): Promise<Row[]> {
  const rows = await db
    .select({
      id: schema.orders.id,
      orderNumber: schema.orders.orderNumber,
      customerName: schema.orders.customerName,
      customerPhone: schema.orders.customerPhone,
      status: schema.orders.status,
      totalKes: schema.orders.totalKes,
      deliveryZone: schema.orders.deliveryZone,
      deliveryDate: schema.orders.deliveryDate,
      createdAt: schema.orders.createdAt,
      shopTitle: schema.shops.title,
      shopSlug: schema.shops.slug,
      itemCount: sql<number>`(select count(*)::int from ${schema.orderItems} where ${schema.orderItems.orderId} = ${schema.orders.id})`,
    })
    .from(schema.orders)
    .leftJoin(schema.shops, eq(schema.shops.id, schema.orders.initialShopId))
    .orderBy(desc(schema.orders.createdAt))
    .limit(200);
  return rows as Row[];
}

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-ochre-400/15 text-ochre-700 border-ochre-400/30',
  confirmed: 'bg-teal-500/15 text-teal-700 border-teal-500/30',
  picked_up: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
  delivered: 'bg-green-500/15 text-green-700 border-green-500/30',
  cancelled: 'bg-gray-300 text-gray-600 border-gray-400',
  refunded: 'bg-terracotta-500/15 text-terracotta-600 border-terracotta-500/30',
};

function fmtDateTime(d: Date) {
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminOrdersPage() {
  const orders = await loadOrders();

  const totals = orders.reduce(
    (acc, o) => {
      acc.count += 1;
      acc.gmv += o.totalKes;
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    },
    { count: 0, gmv: 0 } as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold tracking-widest uppercase text-ochre-600">
          Operations
        </p>
        <h1 className="font-display text-4xl text-teal-900 mt-1">Orders</h1>
        <p className="mt-2 text-teal-900/60 text-sm">
          {totals.count} orders · KES {totals.gmv.toLocaleString('en-KE')} GMV ·{' '}
          {totals.new || 0} new · {totals.confirmed || 0} confirmed ·{' '}
          {totals.delivered || 0} delivered
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-teal-900/15 bg-sand-50 p-16 text-center">
          <p className="font-display text-2xl text-teal-900">No orders yet</p>
          <p className="mt-2 text-sm text-teal-900/50 max-w-sm mx-auto">
            Once a tourist places an order from one of the shops it will show
            up here — new at the top.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-teal-900/10 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-sand-100 text-teal-900/70 text-[11px] tracking-wider uppercase">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Order #</th>
                <th className="text-left font-semibold px-4 py-3">Shop</th>
                <th className="text-left font-semibold px-4 py-3">Customer</th>
                <th className="text-left font-semibold px-4 py-3">Items</th>
                <th className="text-right font-semibold px-4 py-3">Total</th>
                <th className="text-left font-semibold px-4 py-3">Zone</th>
                <th className="text-left font-semibold px-4 py-3">Deliver</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-left font-semibold px-4 py-3">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-900/5">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-sand-50/60 transition">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link
                      href={`/admin/orders/${encodeURIComponent(o.orderNumber)}`}
                      className="text-ochre-600 hover:text-ochre-500"
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-teal-900">
                    {o.shopTitle ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-teal-900">{o.customerName}</p>
                    <p className="text-[11px] text-teal-900/50 font-mono">
                      {o.customerPhone}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-teal-900/70 tabular-nums">
                    {o.itemCount}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-teal-900">
                    KES {o.totalKes.toLocaleString('en-KE')}
                  </td>
                  <td className="px-4 py-3 text-teal-900/70 text-xs capitalize">
                    {o.deliveryZone.replace(/-/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-teal-900/70 text-xs">
                    {o.deliveryDate}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[o.status] ?? STATUS_STYLE.new}`}
                    >
                      {o.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-teal-900/50 text-xs">
                    {fmtDateTime(new Date(o.createdAt))}
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
