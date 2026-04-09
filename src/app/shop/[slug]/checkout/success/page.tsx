import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';
import { loadShop } from '../../_loaders';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function loadOrderForShop(orderNumber: string, shopId: number) {
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.orderNumber, orderNumber),
        eq(schema.orders.initialShopId, shopId),
      ),
    )
    .limit(1);
  if (!order) return null;

  const items = await db
    .select({
      id: schema.orderItems.id,
      qty: schema.orderItems.qty,
      unitPriceKes: schema.orderItems.unitPriceKes,
      discountPct: schema.orderItems.discountPct,
      lineTotalKes: schema.orderItems.lineTotalKes,
      productName: schema.products.name,
    })
    .from(schema.orderItems)
    .leftJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
    .where(eq(schema.orderItems.orderId, order.id));

  return { order, items };
}

export default async function CheckoutSuccessPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const orderNumber = typeof sp.order === 'string' ? sp.order : '';

  const { shop } = await loadShop(slug);
  if (!orderNumber) notFound();

  const data = await loadOrderForShop(orderNumber, shop.id);
  if (!data) notFound();
  const { order, items } = data;

  return (
    <article className="max-w-2xl mx-auto px-6 py-20 font-[var(--mt-font-body)] text-center">
      {/* Big check */}
      <div
        className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: 'var(--mt-primary)', color: 'white' }}
        aria-hidden
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <p className="text-xs uppercase tracking-[0.3em] text-[var(--mt-primary)] mb-2">
        Order placed
      </p>
      <h1 className="font-[var(--mt-font-display)] text-4xl md:text-5xl leading-tight mb-3">
        Asante, {order.customerName.split(' ')[0]}!
      </h1>
      <p className="opacity-75 mb-2">
        Your order <strong className="font-mono">{order.orderNumber}</strong> is
        with {shop.title}.
      </p>
      <p className="opacity-75 mb-10">
        Someone will call <strong>{order.customerPhone}</strong> to confirm
        before we send the driver.
      </p>

      {/* Order summary box */}
      <div className="mx-auto max-w-md rounded-xl border border-black/10 bg-white/80 backdrop-blur p-6 text-left mb-10">
        <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--mt-primary)] mb-4">
          Order summary
        </h2>

        <ul className="space-y-3 pb-4 border-b border-black/10">
          {items.map((it) => (
            <li key={it.id} className="flex justify-between gap-4 text-sm">
              <span className="flex-1">
                <span className="font-semibold">{it.productName}</span>
                <span className="opacity-60"> × {it.qty}</span>
              </span>
              <span>KES {it.lineTotalKes.toLocaleString('en-KE')}</span>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 py-4 text-sm">
          <div className="flex justify-between">
            <dt className="opacity-70">Subtotal</dt>
            <dd>KES {order.productsSubtotalKes.toLocaleString('en-KE')}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="opacity-70">
              Delivery ({order.deliveryZone.replace(/-/g, ' ')})
            </dt>
            <dd>KES {order.deliveryFeeKes.toLocaleString('en-KE')}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="opacity-70">Platform fee</dt>
            <dd>KES {order.marginKes.toLocaleString('en-KE')}</dd>
          </div>
        </dl>

        <div className="flex justify-between pt-4 border-t border-black/10 text-lg">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">
            KES {order.totalKes.toLocaleString('en-KE')}
          </span>
        </div>
        <p className="mt-4 text-xs opacity-60">
          You&apos;ll pay cash on delivery.
        </p>
      </div>

      <div className="space-y-4">
        <Link href={`/shop/${slug}`} className="inline-block">
          <Button variant="primary" size="lg">
            Keep browsing {shop.title}
          </Button>
        </Link>
        <p className="text-xs opacity-60">
          Save <strong className="font-mono">{order.orderNumber}</strong> — if
          you need to reach us, mention this number.
        </p>
      </div>
    </article>
  );
}

export const metadata = {
  title: 'Order placed',
};
