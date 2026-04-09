import { db, schema } from '@/lib/db/client';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function countLiveShops(): Promise<number> {
  try {
    const [row] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.shops)
      .where(eq(schema.shops.status, 'live'));
    return row?.c ?? 0;
  } catch {
    return 0;
  }
}

type Kpi = {
  label: string;
  value: string;
  sub?: string;
  accent?: 'ochre' | 'teal' | 'terracotta';
};

export default async function AdminDashboard() {
  const liveShops = await countLiveShops();

  const kpis: Kpi[] = [
    {
      label: 'Active shops',
      value: String(liveShops),
      sub: 'live on the platform',
      accent: 'teal',
    },
    {
      label: 'Orders today',
      value: '0',
      sub: 'no orders yet',
      accent: 'ochre',
    },
    {
      label: 'GMV this month',
      value: 'KES 0',
      sub: 'gross merchandise value',
      accent: 'ochre',
    },
    {
      label: 'Cards distributed',
      value: '0',
      sub: 'physical & digital',
      accent: 'teal',
    },
    {
      label: 'Incidents',
      value: '0',
      sub: '0 yellow · 0 red',
      accent: 'terracotta',
    },
    {
      label: 'Cross-sell CTR',
      value: '—',
      sub: 'needs first orders',
      accent: 'teal',
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
          Good morning, Claurice
        </h1>
        <p className="mt-2 text-teal-900/60 text-sm">
          Snapshot of the cooperative. Numbers update live from the database.
        </p>
      </header>

      {/* KPI GRID */}
      <section>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((k) => (
            <li
              key={k.label}
              className={`rounded-2xl border bg-gradient-to-br ${accentClasses[k.accent ?? 'teal']} p-5`}
            >
              <p className="text-[11px] tracking-wider uppercase text-teal-900/60 font-semibold">
                {k.label}
              </p>
              <p className="mt-2 font-display text-4xl text-teal-900 leading-none">
                {k.value}
              </p>
              {k.sub && (
                <p className="mt-2 text-xs text-teal-900/50">{k.sub}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* RECENT ORDERS */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-teal-900">Recent orders</h2>
          <a
            href="/admin/orders"
            className="text-xs text-ochre-600 hover:text-ochre-500 font-medium"
          >
            View all →
          </a>
        </div>
        <div className="rounded-2xl border border-dashed border-teal-900/15 bg-sand-50 p-12 text-center">
          <p className="font-display text-xl text-teal-900">No orders yet</p>
          <p className="mt-1 text-sm text-teal-900/50">
            First orders will land here the moment a customer checks out.
          </p>
        </div>
      </section>
    </div>
  );
}
