import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, schema } from '@/lib/db/client';
import { eq } from 'drizzle-orm';
import { createProductForm } from '@/app/actions/shop-admin';
import { PhotoUpload } from '@/components/ui/PhotoUpload';

export const dynamic = 'force-dynamic';

async function loadShop(id: number) {
  const [shop] = await db
    .select({
      id: schema.shops.id,
      slug: schema.shops.slug,
      title: schema.shops.title,
    })
    .from(schema.shops)
    .where(eq(schema.shops.id, id))
    .limit(1);
  return shop ?? null;
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

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const shop = await loadShop(id);
  if (!shop) notFound();

  const action = createProductForm.bind(null, shop.id);

  return (
    <div className="space-y-6 pb-16 max-w-3xl">
      <div>
        <Link
          href={`/admin/shops/${shop.id}/products`}
          className="text-xs text-teal-900/50 hover:text-ochre-500 transition inline-flex items-center gap-1"
        >
          ← Products
        </Link>
        <h1 className="mt-1 font-display text-4xl text-teal-900">
          New Product
        </h1>
        <p className="mt-2 text-sm text-teal-900/60">
          Adding to <strong>{shop.title}</strong>
        </p>
      </div>

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
            className={inputClass}
            placeholder="e.g. Handwoven Kikoy"
          />
        </div>

        <div>
          <Label>Description</Label>
          <textarea
            name="description"
            className={textareaClass}
            placeholder="What is it? What makes it special?"
          />
        </div>

        <div>
          <Label>Production info</Label>
          <textarea
            name="productionInfo"
            className={textareaClass}
            placeholder="How is it made? Where does the material come from?"
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
              className={inputClass}
              placeholder="1200"
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
              defaultValue={1}
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
              defaultValue={0}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <Label>Photos (up to 3)</Label>
          <div className="space-y-4">
            <PhotoUpload name="photo_0" label="Primary photo" />
            <PhotoUpload name="photo_1" label="Photo 2 (optional)" />
            <PhotoUpload name="photo_2" label="Photo 3 (optional)" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Status</Label>
            <select name="status" defaultValue="active" className={inputClass}>
              <option value="active">Active — visible in shop</option>
              <option value="archived">Archived — hidden</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isTop5"
                defaultChecked
                className="h-5 w-5 rounded border-teal-900/20 text-ochre-500 focus:ring-ochre-400"
              />
              <span className="text-sm font-medium text-teal-900">
                Show in Top-5 carousel
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-teal-900/5">
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
            Create product
          </button>
        </div>
      </form>
    </div>
  );
}
