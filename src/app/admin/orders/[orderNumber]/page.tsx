import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';
import { updateOrderStatusForm } from '@/app/actions/order-actions';

export const dynamic = 'force-dynamic';

const STATUS_ORDER = ['new', 'confirmed', 'picked_up', 'delivered'] as const;
type Status = (typeof STATUS_ORDER)[number] | 'cancelled' | 'refunded';

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-ochre-400/15 text-ochre-700 border-ochre-400/30',
  confirmed: 'bg-teal-500/15 text-teal-700 border-teal-500/30',
  picked_up: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
  delivered: 'bg-green-500/15 text-green-700 border-green-500/30',
  cancelled: 'bg-gray-300 text-gray-600 border-gray-400',
  refunded: 'bg-terracotta-500/15 text-terracotta-600 border-terracotta-500/30',
};

async function loadOrder(orderNumber: string) {
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.orderNumber, orderNumber))
    .limit(1);
  if (!order) return null;

  const items = await db
    .select({
      id: schema.orderItems.id,
      qty: schema.orderItems.qty,
      unitPriceKes: schema.orderItems.unitPriceKes,
      discountPct: schema.orderItems.discountPct,
      lineTotalKes: schema.orderItems.lineTotalKes,
      marginKes: schema.orderItems.marginKes,
      productName: schema.products.name,
      productId: schema.products.id,
      shopId: schema.orderItems.shopId,
      shopTitle: schema.shops.title,
      shopSlug: schema.shops.slug,
    })
    .from(schema.orderItems)
    .leftJoin(schema.products, eq(schema.products.id, schema.orderItems.productId))
    .leftJoin(schema.shops, eq(schema.shops.id, schema.orderItems.shopId))
    .where(eq(schema.orderItems.orderId, order.id));

  return { order, items };
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orderNumber: rawNumber } = await params;
  const sp = await searchParams;
  const orderNumber = decodeURIComponent(rawNumber);

  const data = await loadOrder(orderNumber);
  if (!data) notFound();
  const { order, items } = data;

  const statusAction = updateOrderStatusForm.bind(null, order.id);
  const errorMsg = typeof sp.error === 'string' ? sp.error : null;
  const successMsg = typeof sp.ok === 'string' ? 'Status updated.' : null;

  return (
    <div className="space-y-6 pb-16 max-w-5xl">
      <div>
        <Link
          href="/admin/orders"
          className="text-xs text-teal-900/50 hover:text-ochre-500 transition inline-flex items-center gap-1"
        >
          ← Orders
        </Link>
        <h1 className="mt-1 font-display text-4xl text-teal-900 font-mono">
          {order.orderNumber}
        </h1>
        <div className="mt-2 flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLE[order.status]}`}
          >
            {order.status.replace('_', ' ')}
          </span>
          <span className="text-xs text-teal-900/60">
            Placed {new Date(order.createdAt).toLocaleString('en-GB')}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>Error:</strong> {errorMsg}
        </div>
      )}
      {successMsg && !errorMsg && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {successMsg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left col: items + customer */}
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-teal-900/10 bg-white p-6">
            <h2 className="font-display text-xl text-teal-900 mb-4">Items</h2>
            <ul className="divide-y divide-teal-900/5">
              {items.map((it) => (
                <li key={it.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-teal-900">
                      {it.productName ?? '(deleted product)'}
                    </p>
                    <p className="text-xs text-teal-900/60">
                      from {it.shopTitle ?? '—'} · {it.qty} ×{' '}
                      KES {it.unitPriceKes.toLocaleString('en-KE')}
                      {it.discountPct > 0 && ` (−${it.discountPct}%)`}
                    </p>
                  </div>
                  <div className="text-right tabular-nums">
                    <p className="font-semibold text-teal-900">
                      KES {it.lineTotalKes.toLocaleString('en-KE')}
                    </p>
                    <p className="text-[11px] text-teal-900/50">
                      margin KES {it.marginKes.toLocaleString('en-KE')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-teal-900/10 bg-white p-6">
            <h2 className="font-display text-xl text-teal-900 mb-4">Customer</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-teal-900/50 font-semibold">
                  Name
                </dt>
                <dd className="text-teal-900">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-teal-900/50 font-semibold">
                  Phone
                </dt>
                <dd className="font-mono text-teal-900">
                  <a
                    href={`tel:${order.customerPhone.replace(/\s/g, '')}`}
                    className="hover:text-ochre-600"
                  >
                    {order.customerPhone}
                  </a>
                </dd>
              </div>
              {order.customerEmail && (
                <div className="col-span-2">
                  <dt className="text-[11px] uppercase tracking-wider text-teal-900/50 font-semibold">
                    Email
                  </dt>
                  <dd className="text-teal-900">{order.customerEmail}</dd>
                </div>
              )}
              <div className="col-span-2">
                <dt className="text-[11px] uppercase tracking-wider text-teal-900/50 font-semibold">
                  Delivery address
                </dt>
                <dd className="text-teal-900 whitespace-pre-line">
                  {order.deliveryAddress}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-teal-900/50 font-semibold">
                  Zone
                </dt>
                <dd className="text-teal-900 capitalize">
                  {order.deliveryZone.replace(/-/g, ' ')}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-teal-900/50 font-semibold">
                  Date
                </dt>
                <dd className="text-teal-900">{order.deliveryDate}</dd>
              </div>
              {order.notes && (
                <div className="col-span-2">
                  <dt className="text-[11px] uppercase tracking-wider text-teal-900/50 font-semibold">
                    Notes
                  </dt>
                  <dd className="text-teal-900 whitespace-pre-line">
                    {order.notes}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        {/* Right col: totals + status action */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-teal-900/10 bg-white p-6">
            <h2 className="text-xs uppercase tracking-widest text-teal-900/50 font-semibold mb-4">
              Totals
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-teal-900/70">Subtotal</dt>
                <dd>KES {order.productsSubtotalKes.toLocaleString('en-KE')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-teal-900/70">Delivery</dt>
                <dd>KES {order.deliveryFeeKes.toLocaleString('en-KE')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-teal-900/70">Platform margin</dt>
                <dd>KES {order.marginKes.toLocaleString('en-KE')}</dd>
              </div>
              <div className="flex justify-between pt-3 border-t border-teal-900/10 text-base font-semibold text-teal-900">
                <dt>Total</dt>
                <dd>KES {order.totalKes.toLocaleString('en-KE')}</dd>
              </div>
              <div className="pt-2 text-[11px] text-teal-900/50">
                Payment: {order.paymentMethod} on delivery
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-teal-900/10 bg-white p-6">
            <h2 className="text-xs uppercase tracking-widest text-teal-900/50 font-semibold mb-4">
              Update status
            </h2>
            <form action={statusAction} className="space-y-3">
              <select
                name="status"
                defaultValue={order.status}
                className="w-full h-11 px-3 rounded-lg border border-teal-900/15 bg-white text-sm"
              >
                <option value="new">New</option>
                <option value="confirmed">Confirmed (called customer)</option>
                <option value="picked_up">Picked up by driver</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center rounded-lg bg-ochre-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-ochre-600 transition"
              >
                Update status
              </button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
