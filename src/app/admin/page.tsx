import Link from 'next/link';
import { db, schema } from '@/lib/db/client';
import { eq, sql, and, gte } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type Kpi = {
  label: string;
  value: string;
  sub?: string;
  href?: string;
  accent?: 'ochre' | 'teal' | 'terracotta';
};

async function loadMetrics() {
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [[live], [total], [today], [month], [incidents]] = await Promise.all([
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.shops)
      .where(eq(schema.shops.status, 'live')),
    db.select({ c: sql<number>`count(*)::int` }).from(schema.shops),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.orders)
      .where(gte(schema.orders.createdAt, startOfDay)),
    db
      .select({
        c: sql<number>`count(*)::int`,
        gmv: sql<number>`coalesce(sum(${schema.orders.totalKes}), 0)::int`,
      })
      .from(schema.orders)
      .where(gte(schema.orders.createdAt, startOfMonth)),
    db
      .select({
        yellow: sql<number>`count(*) filter (where ${schema.incidentCards.severity} = 'yellow')::int`,
        red: sql<number>`count(*) filter (where ${schema.incidentCards.severity} = 'red')::int`,
      })
      .from(schema.incidentCards),
  ]);

  return {
    liveShops: live.c,
    totalShops: total.c,
    ordersToday: today.c,
    ordersThisMonth: month.c,
    gmvThisMonthKes: month.gmv,
    yellowCards: incidents?.yellow ?? 0,
    redCards: incidents?.red ?? 0,
  };
}

export default async function AdminDashboard() {
  const session = await auth();
  const m = await loadMetrics();

  const name = session?.user?.name ?? 'admin';
  const hour = new Date().getUTCHours();
  const greeting =
    hour < 10 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const kpis: Kpi[] = [
    {
      label: 'Active shops',
      value: String(m.liveShops),
      sub: `${m.totalShops} total · live on the platform`,
      href: '/admin/shops',
      accent: 'teal',
    },
    {
      label: 'Orders today',
      value: String(m.ordersToday),
      sub: `${m.ordersThisMonth} this month`,
      href: '/admin/orders',
      accent: 'ochre',
    },
    {
      label: 'GMV this month',
      value: `KES ${m.gmvThisMonthKes.toLocaleString('en-KE')}`,
      sub: 'gross merchandise value',
      href: '/admin/orders',
      accent: 'ochre',
    },
    {
      label: 'Incidents',
      value: String(m.yellowCards + m.redCards),
      sub: `${m.yellowCards} yellow · ${m.redCards} red`,
      href: '/admin/incidents',
      accent: 'terracotta',
    },
  ];

  const accentClasses: Record<NonNullable<Kpi['accent']>, string> = {
    ochre: 'from-ochre-400/15 to-ochre-400/0 border-ochre-400/30',
    teal: 'from-teal-500/10 to-teal-500/0 border-teal-500/30',
    terracotta: 'from-terracotta-500/10 to-terracotta-500/0 border-terracotta-500/30',
  };

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-semibold tracking-widest uppercase text-ochre-600">
          Dashboard
        </p>
        <h1 className="font-display text-4xl text-teal-900 mt-1">
          {greeting}, {name}
        </h1>
        <p className="mt-2 text-sm text-teal-900/60">
          MaybeTomorrow.store · operator overview
        </p>
      </header>

      {/* KPI grid */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const content = (
            <div
              className={`rounded-2xl border bg-gradient-to-br ${accentClasses[k.accent ?? 'teal']} p-5 h-full transition hover:shadow-md`}
            >
              <p className="text-[11px] tracking-wider uppercase text-teal-900/60 font-semibold">
                {k.label}
              </p>
              <p className="mt-2 font-display text-4xl text-teal-900 leading-none tabular-nums">
                {k.value}
              </p>
              {k.sub && (
                <p className="mt-2 text-xs text-teal-900/50 truncate">{k.sub}</p>
              )}
            </div>
          );
          return (
            <li key={k.label}>
              {k.href ? <Link href={k.href}>{content}</Link> : content}
            </li>
          );
        })}
      </ul>

      {/* Quick actions */}
      <section>
        <h2 className="font-display text-2xl text-teal-900 mb-4">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            href="/admin/shops/new"
            title="Onboard a new shop"
            desc="Create the shell, then add brand values and products."
            emoji="+"
          />
          <QuickAction
            href="/admin/shops"
            title="Browse shops"
            desc="All vendors, their status, products and yellow cards."
            emoji="🏪"
          />
          <QuickAction
            href="/admin/orders"
            title="Review orders"
            desc="New / confirmed / delivered — move orders through the pipeline."
            emoji="📦"
          />
        </div>
      </section>
    </div>
  );
}

function QuickAction({
  href,
  title,
  desc,
  emoji,
}: {
  href: string;
  title: string;
  desc: string;
  emoji: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-teal-900/10 bg-white p-5 hover:border-ochre-500 hover:shadow-md transition"
    >
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-lg bg-ochre-400/15 flex items-center justify-center text-xl">
          {emoji}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg text-teal-900">{title}</p>
          <p className="mt-0.5 text-xs text-teal-900/60">{desc}</p>
        </div>
      </div>
    </Link>
  );
}
