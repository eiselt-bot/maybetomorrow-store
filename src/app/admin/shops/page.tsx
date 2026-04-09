import { db, schema } from '@/lib/db/client';
import { eq, sql, desc } from 'drizzle-orm';
import { env, isProd } from '@/lib/env';

export const dynamic = 'force-dynamic';

type Row = {
  id: number;
  slug: string;
  title: string;
  layoutVariant: string | null;
  status: string;
  yellowCardCount: number;
  productCount: number;
};

async function fetchShops(): Promise<Row[]> {
  try {
    const rows = await db
      .select({
        id: schema.shops.id,
        slug: schema.shops.slug,
        title: schema.shops.title,
        layoutVariant: schema.shops.layoutVariant,
        status: schema.shops.status,
        yellowCardCount: schema.shops.yellowCardCount,
        productCount: sql<number>`(
          select count(*)::int from ${schema.products}
          where ${schema.products.shopId} = ${schema.shops.id}
        )`,
      })
      .from(schema.shops)
      .orderBy(desc(schema.shops.createdAt));
    return rows as Row[];
  } catch (err) {
    console.error('[admin/shops] query failed', err);
    return [];
  }
}

function shopUrl(slug: string): string {
  if (isProd) return `https://${slug}.${env.APEX_DOMAIN}`;
  return `/shop/${slug}`;
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    live: 'bg-teal-500/15 text-teal-700 border-teal-500/30',
    draft: 'bg-sand-200 text-teal-900/60 border-teal-900/10',
    paused: 'bg-ochre-400/15 text-ochre-600 border-ochre-400/30',
    archived: 'bg-terracotta-500/10 text-terracotta-600 border-terracotta-500/30',
  };
  return map[s] || map.draft;
}

export default async function AdminShopsPage() {
  const shops = await fetchShops();

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-ochre-600">
            Vendors
          </p>
          <h1 className="font-display text-4xl text-teal-900 mt-1">Shops</h1>
          <p className="mt-2 text-teal-900/60 text-sm">
            {shops.length} total · {shops.filter((s) => s.status === 'live').length} live
          </p>
        </div>
      </header>

      {shops.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-teal-900/15 bg-sand-50 p-12 text-center">
          <p className="font-display text-xl text-teal-900">No shops yet</p>
          <p className="mt-1 text-sm text-teal-900/50">
            Run the seed script to populate the cooperative.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-teal-900/10 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-sand-100 text-teal-900/70 text-[11px] tracking-wider uppercase">
              <tr>
                <th className="text-left font-semibold px-4 py-3">ID</th>
                <th className="text-left font-semibold px-4 py-3">Slug</th>
                <th className="text-left font-semibold px-4 py-3">Title</th>
                <th className="text-left font-semibold px-4 py-3">Layout</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-right font-semibold px-4 py-3">Yellow</th>
                <th className="text-right font-semibold px-4 py-3">Products</th>
                <th className="text-right font-semibold px-4 py-3">Live</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-900/5">
              {shops.map((s) => (
                <tr key={s.id} className="hover:bg-sand-50/60 transition">
                  <td className="px-4 py-3 text-teal-900/60 font-mono text-xs">
                    {s.id}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ochre-600">
                    {s.slug}
                  </td>
                  <td className="px-4 py-3 font-medium text-teal-900">
                    {s.title}
                  </td>
                  <td className="px-4 py-3 text-teal-900/70 text-xs">
                    {s.layoutVariant || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${statusBadge(s.status)}`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-teal-900/70 tabular-nums">
                    {s.yellowCardCount}
                  </td>
                  <td className="px-4 py-3 text-right text-teal-900/70 tabular-nums">
                    {s.productCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={shopUrl(s.slug)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ochre-600 hover:text-ochre-500 text-xs font-medium"
                    >
                      View live →
                    </a>
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
