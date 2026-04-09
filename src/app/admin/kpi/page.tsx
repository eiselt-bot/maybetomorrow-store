import { db, schema } from '@/lib/db/client';
import { eq, sql, gte, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function loadKpis() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const [
    [shops],
    [orders],
    [orders30d],
    [delivered],
    [topShop],
    [aov],
    [incidents],
  ] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        live: sql<number>`count(*) filter (where status = 'live')::int`,
        draft: sql<number>`count(*) filter (where status = 'draft')::int`,
      })
      .from(schema.shops),
    db
      .select({
        count: sql<number>`count(*)::int`,
        gmv: sql<number>`coalesce(sum(total_kes), 0)::int`,
        margin: sql<number>`coalesce(sum(margin_kes), 0)::int`,
      })
      .from(schema.orders),
    db
      .select({
        count: sql<number>`count(*)::int`,
        gmv: sql<number>`coalesce(sum(total_kes), 0)::int`,
      })
      .from(schema.orders)
      .where(gte(schema.orders.createdAt, thirtyDaysAgo)),
    db
      .select({
        count: sql<number>`count(*) filter (where status = 'delivered')::int`,
        cancelled: sql<number>`count(*) filter (where status = 'cancelled')::int`,
      })
      .from(schema.orders),
    db
      .select({
        shopId: schema.orderItems.shopId,
        shopTitle: schema.shops.title,
        revenue: sql<number>`coalesce(sum(${schema.orderItems.lineTotalKes}), 0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.orderItems)
      .leftJoin(schema.shops, eq(schema.shops.id, schema.orderItems.shopId))
      .groupBy(schema.orderItems.shopId, schema.shops.title)
      .orderBy(sql`sum(${schema.orderItems.lineTotalKes}) desc nulls last`)
      .limit(1),
    db
      .select({
        avg: sql<number>`coalesce(round(avg(total_kes))::int, 0)`,
      })
      .from(schema.orders),
    db
      .select({
        total: sql<number>`count(*)::int`,
        yellow: sql<number>`count(*) filter (where severity = 'yellow')::int`,
        red: sql<number>`count(*) filter (where severity = 'red')::int`,
      })
      .from(schema.incidentCards),
  ]);

  const conversionRate =
    orders.count && shops.live
      ? Math.round((orders.count / shops.live) * 10) / 10
      : 0;
  const deliveryRate =
    orders.count && delivered.count
      ? Math.round((delivered.count / orders.count) * 100)
      : 0;
  const cancellationRate =
    orders.count && delivered.cancelled
      ? Math.round((delivered.cancelled / orders.count) * 100)
      : 0;

  return {
    shops,
    orders,
    orders30d,
    delivered: delivered.count,
    cancelled: delivered.cancelled,
    topShop,
    aov: aov.avg,
    incidents,
    conversionRate,
    deliveryRate,
    cancellationRate,
  };
}

type Metric = {
  label: string;
  value: string;
  sub?: string;
};

export default async function AdminKpiPage() {
  const k = await loadKpis();

  const metrics: Metric[] = [
    {
      label: 'Total shops',
      value: String(k.shops.total),
      sub: `${k.shops.live} live · ${k.shops.draft} draft`,
    },
    {
      label: 'Total orders',
      value: String(k.orders.count),
      sub: `${k.orders30d.count} in last 30 days`,
    },
    {
      label: 'GMV (all time)',
      value: `KES ${k.orders.gmv.toLocaleString('en-KE')}`,
      sub: `KES ${k.orders30d.gmv.toLocaleString('en-KE')} last 30d`,
    },
    {
      label: 'Platform margin',
      value: `KES ${k.orders.margin.toLocaleString('en-KE')}`,
      sub: 'cumulative, from delivered orders',
    },
    {
      label: 'Avg order value',
      value: `KES ${k.aov.toLocaleString('en-KE')}`,
      sub: 'across all orders',
    },
    {
      label: 'Orders / live shop',
      value: String(k.conversionRate),
      sub: 'lifetime per active vendor',
    },
    {
      label: 'Delivery success',
      value: `${k.deliveryRate}%`,
      sub: `${k.delivered} delivered, ${k.cancelled} cancelled`,
    },
    {
      label: 'Top shop',
      value: k.topShop?.shopTitle ?? '—',
      sub: k.topShop
        ? `KES ${k.topShop.revenue.toLocaleString('en-KE')} in ${k.topShop.count} items`
        : 'needs first order',
    },
    {
      label: 'Incidents',
      value: String(k.incidents?.total ?? 0),
      sub: `${k.incidents?.yellow ?? 0} yellow · ${k.incidents?.red ?? 0} red`,
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold tracking-widest uppercase text-ochre-600">
          Analytics
        </p>
        <h1 className="font-display text-4xl text-teal-900 mt-1">KPI</h1>
        <p className="mt-2 text-teal-900/60 text-sm">
          Cooperative-wide health metrics. Updates in real-time.
        </p>
      </header>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <li
            key={m.label}
            className="rounded-2xl border border-teal-900/10 bg-white p-5"
          >
            <p className="text-[11px] tracking-wider uppercase text-teal-900/50 font-semibold">
              {m.label}
            </p>
            <p className="mt-2 font-display text-3xl text-teal-900 leading-none tabular-nums truncate">
              {m.value}
            </p>
            {m.sub && (
              <p className="mt-2 text-xs text-teal-900/60 truncate">{m.sub}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
