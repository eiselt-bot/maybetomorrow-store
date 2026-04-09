import Link from 'next/link';
import { notFound } from 'next/navigation';

import { loadShop } from '../_loaders';
import { findProductForCheckout, getDeliveryFeeKes } from '@/lib/services/order-service';
import { placeOrderForm } from '@/app/actions/order-actions';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Button } from '@/components/ui/Button';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const DEFAULT_ZONE: 'diani-strip' | 'south-coast' | 'mombasa' | 'further' = 'diani-strip';

export default async function CheckoutPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const productId = Number(sp.product);
  const marginPct = Number(process.env.PLATFORM_MARGIN_PCT ?? '10');

  // If no product in the query, show a "pick something first" landing view.
  if (!Number.isFinite(productId) || productId <= 0) {
    const { shop } = await loadShop(slug);
    return (
      <article className="max-w-2xl mx-auto px-6 py-16 font-[var(--mt-font-body)] text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--mt-primary)] mb-2">
          Checkout
        </p>
        <h1 className="font-[var(--mt-font-display)] text-4xl md:text-5xl leading-tight mb-4">
          Pick something to order
        </h1>
        <p className="opacity-75 mb-8">
          To place an order from {shop.title}, first open a product and press
          &ldquo;Order now&rdquo;.
        </p>
        <Link href={`/shop/${slug}`} className="inline-block">
          <Button variant="primary" size="lg">
            ← Back to {shop.title}
          </Button>
        </Link>
      </article>
    );
  }

  // Load the specific product for this checkout
  const found = await findProductForCheckout(slug, productId);
  if (!found) notFound();
  const { shop, product } = found;
  const { rates } = await loadShop(slug);

  // Compute display totals for the summary (before form submit)
  const netUnitKes = Math.round(product.priceKes * (1 - product.discountPct / 100));
  const defaultQty = Math.max(1, Math.min(50, Number(sp.f_qty) || 1));
  const lineTotalKes = netUnitKes * defaultQty;
  const currentZone = (typeof sp.f_zone === 'string' ? sp.f_zone : DEFAULT_ZONE) as
    | 'diani-strip'
    | 'south-coast'
    | 'mombasa'
    | 'further';
  const deliveryFeeKes = getDeliveryFeeKes(currentZone);
  const marginKes = Math.round(lineTotalKes * (marginPct / 100));
  const totalKes = lineTotalKes + deliveryFeeKes + marginKes;

  const errorMsg = typeof sp.error === 'string' ? sp.error : null;
  const getPrefill = (key: string) =>
    typeof sp[`f_${key}`] === 'string' ? (sp[`f_${key}`] as string) : '';

  const action = placeOrderForm.bind(null, slug, product.id);

  return (
    <article className="max-w-5xl mx-auto px-6 py-16 font-[var(--mt-font-body)]">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--mt-primary)] mb-2">
          Checkout
        </p>
        <h1 className="font-[var(--mt-font-display)] text-4xl md:text-5xl leading-tight mb-2">
          Order from {shop.title}
        </h1>
        <p className="opacity-75">
          Cash on delivery. We&apos;ll call to confirm before sending.
        </p>
      </header>

      {errorMsg && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>Couldn&apos;t place the order:</strong> {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Form — spans 3 columns */}
        <form action={action} className="lg:col-span-3 space-y-8" noValidate>
          <input type="hidden" name="qty" value={defaultQty} />

          <section>
            <h2 className="font-[var(--mt-font-display)] text-xl mb-4 pb-2 border-b border-black/10">
              Your contact
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Full name"
                name="name"
                required
                placeholder="e.g. Amina Mwangi"
                defaultValue={getPrefill('name')}
              />
              <Field
                label="Phone"
                name="phone"
                type="tel"
                required
                placeholder="+254 7__ ___ ___"
                defaultValue={getPrefill('phone')}
              />
              <Field
                label="Email (optional)"
                name="email"
                type="email"
                placeholder="you@example.com"
                wide
                defaultValue={getPrefill('email')}
              />
            </div>
          </section>

          <section>
            <h2 className="font-[var(--mt-font-display)] text-xl mb-4 pb-2 border-b border-black/10">
              Delivery
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1.5 opacity-70">
                  Zone <span className="text-red-500">*</span>
                </label>
                <select
                  name="zone"
                  className="w-full h-11 px-3 rounded-md border border-black/20 bg-white focus:border-[var(--mt-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--mt-primary)]/30"
                  defaultValue={currentZone}
                  required
                >
                  <option value="diani-strip">Diani Strip · KES 200</option>
                  <option value="south-coast">South Coast · KES 500</option>
                  <option value="mombasa">Mombasa · KES 1,500</option>
                  <option value="further">Further · KES 3,000</option>
                </select>
              </div>
              <Field
                label="Delivery date"
                name="deliveryDate"
                type="date"
                required
                defaultValue={getPrefill('deliveryDate')}
              />
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-wider mb-1.5 opacity-70">
                  Delivery address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  rows={3}
                  required
                  placeholder="Hotel, villa or landmark — describe so we can find you"
                  defaultValue={getPrefill('address')}
                  className="w-full px-3 py-2 rounded-md border border-black/20 bg-white focus:border-[var(--mt-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--mt-primary)]/30 resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-wider mb-1.5 opacity-70">
                  Notes for the seller (optional)
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Preferred size, color, or anything else"
                  defaultValue={getPrefill('notes')}
                  className="w-full px-3 py-2 rounded-md border border-black/20 bg-white focus:border-[var(--mt-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--mt-primary)]/30 resize-none"
                />
              </div>
            </div>
          </section>

          <section className="bg-black/5 rounded-lg p-5 text-sm space-y-2">
            <p className="font-semibold">How this works</p>
            <ol className="list-decimal list-inside opacity-80 space-y-1">
              <li>You place the order — no payment yet.</li>
              <li>We call to confirm your items and delivery window.</li>
              <li>A driver brings it to you. You pay cash on delivery.</li>
            </ol>
          </section>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Link
              href={`/shop/${slug}/product/${product.id}`}
              className="text-sm text-[var(--mt-primary)] underline underline-offset-4"
            >
              ← Back to product
            </Link>
            <Button type="submit" variant="primary" size="lg">
              Place order · KES {totalKes.toLocaleString('en-KE')}
            </Button>
          </div>
        </form>

        {/* Order summary — sticky on desktop */}
        <aside className="lg:col-span-2">
          <div className="sticky top-6 rounded-xl border border-black/10 bg-white/80 backdrop-blur p-6">
            <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--mt-primary)] mb-4">
              Order summary
            </h2>

            <div className="flex gap-4 pb-4 border-b border-black/10">
              {product.photos?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.photos[0]}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-lg bg-black/5"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-black/5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{product.name}</p>
                <p className="text-xs opacity-60 truncate">{shop.title}</p>
                <div className="mt-1">
                  <PriceDisplay
                    priceKes={product.priceKes}
                    discountPct={product.discountPct}
                    rates={rates}
                    compact
                  />
                </div>
                <p className="mt-1 text-xs opacity-60">Quantity: {defaultQty}</p>
              </div>
            </div>

            <dl className="space-y-2 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="opacity-70">Subtotal</dt>
                <dd>KES {lineTotalKes.toLocaleString('en-KE')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="opacity-70">
                  Delivery ({currentZone.replace(/-/g, ' ')})
                </dt>
                <dd>KES {deliveryFeeKes.toLocaleString('en-KE')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="opacity-70">Platform fee ({marginPct}%)</dt>
                <dd>KES {marginKes.toLocaleString('en-KE')}</dd>
              </div>
            </dl>

            <div className="flex justify-between pt-4 border-t border-black/10 text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">
                KES {totalKes.toLocaleString('en-KE')}
              </span>
            </div>

            <p className="mt-4 text-[11px] opacity-60 leading-snug">
              The zone dropdown changes the delivery fee. Refresh the page
              after changing it to see the updated total on the button.
            </p>
          </div>
        </aside>
      </div>
    </article>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
  placeholder,
  wide = false,
  defaultValue = '',
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  wide?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label htmlFor={name} className="block text-xs uppercase tracking-wider mb-1.5 opacity-70">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full h-11 px-3 rounded-md border border-black/20 bg-white focus:border-[var(--mt-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--mt-primary)]/30"
      />
    </div>
  );
}
