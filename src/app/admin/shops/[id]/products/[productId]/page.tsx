import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, schema } from '@/lib/db/client';
import { and, eq } from 'drizzle-orm';
import {
  updateProductForm,
  deleteProductForm,
} from '@/app/actions/shop-admin';
import { PhotoUpload } from '@/components/ui/PhotoUpload';

export const dynamic = 'force-dynamic';

async function loadShopAndProduct(shopId: number, productId: number) {
  const [shop] = await db
    .select({
      id: schema.shops.id,
      slug: schema.shops.slug,
      title: schema.shops.title,
    })
    .from(schema.shops)
    .where(eq(schema.shops.id, shopId))
    .limit(1);
  if (!shop) return null;

  const [product] = await db
    .select()
    .from(schema.products)
    .where(
      and(
        eq(schema.products.id, productId),
        eq(schema.products.shopId, shopId),
      ),
    )
    .limit(1);
  if (!product) return null;

  return { shop, product };
}

const inputClass =
  'w-full rounded-lg border border-teal-900/15 bg-white px-3 py-2 text-sm text-teal-900 placeholder:text-teal-900/30 focus:border-ochre-500 focus:outline-none focus:ring-2 focus:ring-ochre-400/30 transition';
const textareaClass = `${inputClass} min-h-[100px] resize-y`;

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold tracking-widest uppercase text-teal-900/60 mb-1.5">
      {children}
      {required && <span className="text-terracotta-600 ml-1">*</span>}
    </label>
  );
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string; productId: string }>;
}) {
  const { id: idParam, productId: pidParam } = await params;
  const shopId = Number(idParam);
  const productId = Number(pidParam);
  if (
    !Number.isFinite(shopId) ||
    shopId <= 0 ||
    !Number.isFinite(productId) ||
    productId <= 0
  ) {
    notFound();
  }

  const data = await loadShopAndProduct(shopId, productId);
  if (!data) notFound();
  const { shop, product } = data;

  const photos: string[] = Array.isArray(product.photos) ? product.photos : [];
  const photoDefaults = [0, 1, 2].map((i) => photos[i] ?? '');

  const action = updateProductForm.bind(null, shop.id, product.id);
  const del = deleteProductForm.bind(null, shop.id, product.id);

  return (
    <div className="space-y-6 pb-16 max-w-3xl">
      <div>
        <Link
          href={`/admin/shops/${shop.id}/products`}
          className="text-xs text-teal-900/50 hover:text-ochre-500 transition inline-flex items-center gap-1"
        >
          ← Products
        </Link>
        <div className="mt-1 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="font-display text-4xl text-teal-900">
            Edit Product
          </h1>
          <div className="flex items-center gap-3 text-xs text-teal-900/50">
            <span>#{product.id}</span>
            <span>·</span>
            <span>{product.soldCount} sold</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-teal-900/60">
          In <strong>{shop.title}</strong>
        </p>
      </div>

      {/* Photo preview */}
      {photos.length > 0 && (
        <div className="flex items-center gap-3">
          {photos.slice(0, 3).map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={p}
              alt={`${product.name} ${i + 1}`}
              className="h-20 w-20 rounded-lg object-cover border border-teal-900/10"
            />
          ))}
        </div>
      )}

      <form
        action={action}
        className="rounded-2xl border border-teal-900/10 bg-white p-6 shadow-sm space-y-5"
      >
        <div>
          <Label required>Name</Label>
          <input
            type="text"
            name="name"
            required
            defaultValue={product.name}
            className={inputClass}
          />
        </div>

        <div>
          <Label>Description</Label>
          <textarea
            name="description"
            defaultValue={product.description ?? ''}
            className={textareaClass}
          />
        </div>

        <div>
          <Label>Production info</Label>
          <textarea
            name="productionInfo"
            defaultValue={product.productionInfo ?? ''}
            className={textareaClass}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label required>Price (KES)</Label>
            <input
              type="number"
              name="priceKes"
              min={0}
              step={1}
              required
              defaultValue={product.priceKes}
              className={inputClass}
            />
          </div>
          <div>
            <Label>Delivery days</Label>
            <input
              type="number"
              name="deliveryDays"
              min={0}
              max={365}
              step={1}
              defaultValue={product.deliveryDays ?? 1}
              className={inputClass}
            />
          </div>
          <div>
            <Label>Discount %</Label>
            <input
              type="number"
              name="discountPct"
              min={0}
              max={100}
              step={1}
              defaultValue={product.discountPct}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <Label>Photos (up to 3)</Label>
          <div className="space-y-4">
            <PhotoUpload name="photo_0" label="Primary photo" defaultUrl={photoDefaults[0] || ''} />
            <PhotoUpload name="photo_1" label="Photo 2" defaultUrl={photoDefaults[1] || ''} />
            <PhotoUpload name="photo_2" label="Photo 3" defaultUrl={photoDefaults[2] || ''} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Status</Label>
            <select
              name="status"
              defaultValue={product.status}
              className={inputClass}
            >
              <option value="active">Active — visible in shop</option>
              <option value="archived">Archived — hidden</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isTop5"
                defaultChecked={product.isTop5}
                className="h-5 w-5 rounded border-teal-900/20 text-ochre-500 focus:ring-ochre-400"
              />
              <span className="text-sm font-medium text-teal-900">
                Show in Top-5 carousel
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-4 border-t border-teal-900/5">
          <Link
            href={`/admin/shops/${shop.id}/products`}
            className="inline-flex items-center rounded-lg border border-teal-900/15 px-4 py-2 text-sm font-semibold text-teal-900 hover:border-ochre-500 hover:text-ochre-600 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center rounded-lg bg-ochre-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-ochre-600 transition"
          >
            Save changes
          </button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="rounded-2xl border border-terracotta-500/30 bg-terracotta-500/5 p-5">
        <p className="font-display text-base text-terracotta-600">Danger zone</p>
        <p className="mt-1 text-xs text-teal-900/60">
          Deleting a product cannot be undone. Past order history is preserved.
        </p>
        <form action={del} className="mt-3">
          <button
            type="submit"
            className="inline-flex items-center rounded-lg border border-terracotta-500/50 bg-white px-4 py-2 text-xs font-semibold text-terracotta-600 hover:bg-terracotta-500 hover:text-white transition"
          >
            Delete product
          </button>
        </form>
      </div>
    </div>
  );
}
