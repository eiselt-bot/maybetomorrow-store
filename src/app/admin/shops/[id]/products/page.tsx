import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, schema } from '@/lib/db/client';
import { eq, desc } from 'drizzle-orm';
import {
  toggleProductTop5Form,
  deleteProductForm,
  updateProductDiscountForm,
} from '@/app/actions/shop-admin';

export const dynamic = 'force-dynamic';

async function loadShopWithProducts(id: number) {
  const [shop] = await db
    .select()
    .from(schema.shops)
    .where(eq(schema.shops.id, id))
    .limit(1);
  if (!shop) return null;

  const products = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.shopId, id))
    .orderBy(desc(schema.products.createdAt));

  return { shop, products };
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const data = await loadShopWithProducts(id);
  if (!data) notFound();
  const { shop, products } = data;

  const activeCount = products.filter((p) => p.status === 'active').length;
  const top5Count = products.filter((p) => p.isTop5).length;
  const discountedCount = products.filter((p) => p.discountPct > 0).length;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <Link
            href={`/admin/shops/${shop.id}`}
            className="text-xs text-teal-900/50 hover:text-ochre-500 transition inline-flex items-center gap-1"
          >
            ← {shop.title}
          </Link>
          <h1 className="mt-1 font-display text-4xl text-teal-900">Products</h1>
          <p className="mt-2 text-sm text-teal-900/60">
            {products.length} total · {activeCount} active · {top5Count} in Top-5
            · {discountedCount} on discount
          </p>
        </div>
        <Link
          href={`/admin/shops/${shop.id}/products/new`}
          className="inline-flex items-center gap-1 rounded-lg bg-ochre-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ochre-600 transition"
        >
          + New product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-teal-900/15 bg-sand-50 p-12 text-center">
          <p className="font-display text-xl text-teal-900">No products yet</p>
          <p className="mt-1 text-sm text-teal-900/50">
            Create the first one to populate this shop.
          </p>
          <Link
            href={`/admin/shops/${shop.id}/products/new`}
            className="mt-4 inline-flex items-center gap-1 rounded-lg bg-ochre-500 px-4 py-2 text-sm font-semibold text-white hover:bg-ochre-600 transition"
          >
            + Create first product
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-teal-900/10 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-sand-100 text-teal-900/70 text-[11px] tracking-wider uppercase">
              <tr>
                <th className="text-left font-semibold px-4 py-3 w-16">Photo</th>
                <th className="text-left font-semibold px-4 py-3">Name</th>
                <th className="text-right font-semibold px-4 py-3">Price (KES)</th>
                <th className="text-left font-semibold px-4 py-3 w-32">
                  Discount
                </th>
                <th className="text-center font-semibold px-4 py-3">Top-5</th>
                <th className="text-right font-semibold px-4 py-3">Sold</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-900/5">
              {products.map((p) => {
                const photo =
                  Array.isArray(p.photos) && p.photos.length > 0
                    ? p.photos[0]
                    : null;
                const toggleTop5 = toggleProductTop5Form.bind(
                  null,
                  shop.id,
                  p.id,
                );
                const del = deleteProductForm.bind(null, shop.id, p.id);
                const setDiscount = updateProductDiscountForm.bind(
                  null,
                  shop.id,
                  p.id,
                );
                return (
                  <tr key={p.id} className="hover:bg-sand-50/60 transition">
                    <td className="px-4 py-3">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo}
                          alt={p.name}
                          className="h-12 w-12 rounded-md object-cover border border-teal-900/10"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-sand-100 border border-teal-900/10" />
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <Link
                        href={`/admin/shops/${shop.id}/products/${p.id}`}
                        className="font-medium text-teal-900 hover:text-ochre-600"
                      >
                        {p.name}
                      </Link>
                      {p.description && (
                        <p className="text-[11px] text-teal-900/50 line-clamp-1 mt-0.5">
                          {p.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-teal-900">
                      {p.priceKes.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <form action={setDiscount} className="flex items-center gap-1.5">
                        <input
                          type="number"
                          name="discountPct"
                          defaultValue={p.discountPct}
                          min={0}
                          max={100}
                          step={1}
                          className="w-14 rounded border border-teal-900/15 px-1.5 py-1 text-xs text-center focus:border-ochre-500 focus:outline-none"
                        />
                        <span className="text-xs text-teal-900/40">%</span>
                        <button
                          type="submit"
                          className="text-[10px] font-semibold text-ochre-600 hover:text-ochre-500 uppercase tracking-wider"
                        >
                          set
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <form action={toggleTop5}>
                        <button
                          type="submit"
                          className={`text-xl leading-none transition ${p.isTop5 ? 'text-ochre-500 hover:text-ochre-600' : 'text-teal-900/20 hover:text-teal-900/40'}`}
                          title={p.isTop5 ? 'In Top-5' : 'Not in Top-5'}
                        >
                          ★
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-teal-900/70">
                      {p.soldCount}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${p.status === 'active' ? 'bg-teal-500/10 text-teal-700' : 'bg-sand-200 text-teal-900/50'}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-3">
                        <Link
                          href={`/admin/shops/${shop.id}/products/${p.id}`}
                          className="text-xs font-semibold text-ochre-600 hover:text-ochre-500"
                        >
                          Edit
                        </Link>
                        <form action={del}>
                          <button
                            type="submit"
                            className="text-xs font-semibold text-terracotta-600 hover:text-terracotta-500"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
