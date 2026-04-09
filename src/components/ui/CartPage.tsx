'use client';

/**
 * Shop cart page — client-rendered from localStorage.
 *
 * Hydrates the item list by fetching product data for each productId
 * via a JSON endpoint (/api/shop/<slug>/products?ids=1,2,3). Renders
 * line items with qty controls and an order summary. On "Proceed to
 * checkout" it serialises the cart into a hidden input and POSTs to
 * the placeOrderForm server action along with the contact/delivery
 * fields.
 */

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { placeCartOrderForm } from '@/app/actions/order-actions';

type Props = {
  slug: string;
  shopTitle: string;
  shopId: number;
  marginPct: number;
  deliveryFees: Record<string, { label: string; feeKes: number }>;
};

type CartItem = {
  productId: number;
  qty: number;
  variantSize?: string;
  variantColor?: string;
};

type HydratedProduct = {
  id: number;
  name: string;
  priceKes: number;
  discountPct: number;
  photo?: string | null;
};

export function CartPage({
  slug,
  shopTitle,
  shopId,
  marginPct,
  deliveryFees,
}: Props) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Record<number, HydratedProduct>>({});
  const [loaded, setLoaded] = useState(false);
  const [zone, setZone] = useState<string>('diani-strip');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Load cart from localStorage + fetch product details
  useEffect(() => {
    const key = `mt-cart-${slug}`;
    let cartItems: CartItem[] = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) cartItems = JSON.parse(raw) as CartItem[];
    } catch {}
    setItems(cartItems);

    if (cartItems.length === 0) {
      setLoaded(true);
      return;
    }

    const ids = [...new Set(cartItems.map((i) => i.productId))].join(',');
    fetch(`/api/shop/${slug}/products?ids=${ids}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((data: { products: HydratedProduct[] }) => {
        const map: Record<number, HydratedProduct> = {};
        for (const p of data.products) map[p.id] = p;
        setProducts(map);
        setLoaded(true);
      })
      .catch((e) => {
        setError(`Couldn't load product details: ${e}`);
        setLoaded(true);
      });
  }, [slug]);

  function persist(newItems: CartItem[]) {
    setItems(newItems);
    localStorage.setItem(`mt-cart-${slug}`, JSON.stringify(newItems));
    window.dispatchEvent(new Event('mt-cart-updated'));
  }

  function updateQty(idx: number, delta: number) {
    const next = [...items];
    next[idx] = { ...next[idx], qty: Math.max(1, next[idx].qty + delta) };
    persist(next);
  }

  function removeItem(idx: number) {
    const next = items.filter((_, i) => i !== idx);
    persist(next);
  }

  // Compute totals
  let subtotal = 0;
  const hydrated = items
    .map((it) => {
      const p = products[it.productId];
      if (!p) return null;
      const net = Math.round(p.priceKes * (1 - p.discountPct / 100));
      const line = net * it.qty;
      subtotal += line;
      return { item: it, product: p, net, line };
    })
    .filter(Boolean) as Array<{
    item: CartItem;
    product: HydratedProduct;
    net: number;
    line: number;
  }>;

  const deliveryFee = deliveryFees[zone]?.feeKes ?? 0;
  const marginKes = Math.round(subtotal * (marginPct / 100));
  const total = subtotal + deliveryFee + marginKes;

  if (!loaded) {
    return (
      <article className="max-w-4xl mx-auto px-6 py-16 text-center">
        <p className="opacity-60">Loading cart…</p>
      </article>
    );
  }

  if (items.length === 0) {
    return (
      <article className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--mt-primary)] mb-2">
          Cart
        </p>
        <h1 className="font-[var(--mt-font-display)] text-4xl md:text-5xl leading-tight mb-4">
          Your cart is empty
        </h1>
        <p className="opacity-75 mb-8">
          Browse {shopTitle} and add something you like.
        </p>
        <Link
          href={`/shop/${slug}`}
          className="inline-flex items-center h-12 px-6 rounded-xl bg-[var(--mt-primary)] text-white font-semibold hover:opacity-90"
        >
          ← Back to {shopTitle}
        </Link>
      </article>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set('cart', JSON.stringify(items));

    startTransition(async () => {
      try {
        await placeCartOrderForm(slug, fd);
        // Clear cart on success; the server action will redirect before
        // we get here, but clear anyway as a safety net
        localStorage.removeItem(`mt-cart-${slug}`);
        window.dispatchEvent(new Event('mt-cart-updated'));
      } catch (err) {
        // Next.js redirects throw a digest-style error; treat as success
        if ((err as Error).message?.includes('NEXT_REDIRECT')) {
          localStorage.removeItem(`mt-cart-${slug}`);
          window.dispatchEvent(new Event('mt-cart-updated'));
          return;
        }
        setError((err as Error).message);
      }
    });
  }

  return (
    <article className="max-w-5xl mx-auto px-6 py-16 font-[var(--mt-font-body)]">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--mt-primary)] mb-2">
          Checkout
        </p>
        <h1 className="font-[var(--mt-font-display)] text-4xl md:text-5xl leading-tight mb-2">
          Your cart
        </h1>
        <p className="opacity-75">{items.length} item{items.length === 1 ? '' : 's'} from {shopTitle}</p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>Couldn&apos;t place order:</strong> {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Items + contact form */}
        <div className="lg:col-span-3 space-y-8">
          {/* Items list */}
          <section className="space-y-3">
            {hydrated.map((row, idx) => (
              <div
                key={idx}
                className="flex gap-4 rounded-xl border border-black/10 bg-white/60 p-4"
              >
                {row.product.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.product.photo}
                    alt={row.product.name}
                    className="w-20 h-20 object-cover rounded-lg bg-black/5"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-black/5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{row.product.name}</p>
                  {(row.item.variantSize || row.item.variantColor) && (
                    <p className="text-xs text-[var(--mt-primary)] mt-0.5">
                      {row.item.variantSize && `Size: ${row.item.variantSize}`}
                      {row.item.variantSize && row.item.variantColor && ' · '}
                      {row.item.variantColor && `Color: ${row.item.variantColor}`}
                    </p>
                  )}
                  <p className="text-xs opacity-60 mt-1">
                    KES {row.net.toLocaleString('en-KE')} each
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center border border-black/20 rounded-md h-9 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQty(idx, -1)}
                        className="w-8 h-full hover:bg-black/5"
                      >
                        −
                      </button>
                      <span className="w-8 text-center tabular-nums">
                        {row.item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(idx, +1)}
                        className="w-8 h-full hover:bg-black/5"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">
                    KES {row.line.toLocaleString('en-KE')}
                  </p>
                </div>
              </div>
            ))}
          </section>

          {/* Contact */}
          <section>
            <h2 className="font-[var(--mt-font-display)] text-xl mb-4 pb-2 border-b border-black/10">
              Your contact
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name" name="name" required placeholder="e.g. Amina Mwangi" />
              <Field label="Phone" name="phone" type="tel" required placeholder="+254 7__ ___ ___" />
              <Field label="Email (optional)" name="email" type="email" placeholder="you@example.com" wide />
            </div>
          </section>

          {/* Delivery */}
          <section>
            <h2 className="font-[var(--mt-font-display)] text-xl mb-4 pb-2 border-b border-black/10">
              Delivery
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1.5 opacity-70">
                  Zone
                </label>
                <select
                  name="zone"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full h-11 px-3 rounded-md border border-black/20 bg-white"
                >
                  {Object.entries(deliveryFees).map(([key, v]) => (
                    <option key={key} value={key}>
                      {v.label} · KES {v.feeKes.toLocaleString('en-KE')}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Delivery date" name="deliveryDate" type="date" required />
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-wider mb-1.5 opacity-70">
                  Delivery address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  rows={3}
                  required
                  placeholder="Hotel, villa or landmark — describe so we can find you"
                  className="w-full px-3 py-2 rounded-md border border-black/20 bg-white resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-wider mb-1.5 opacity-70">
                  Notes for the seller (optional)
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-black/20 bg-white resize-none"
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
        </div>

        {/* Sticky summary */}
        <aside className="lg:col-span-2">
          <div className="sticky top-6 rounded-xl border border-black/10 bg-white/80 backdrop-blur p-6">
            <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--mt-primary)] mb-4">
              Order summary
            </h2>
            <dl className="space-y-2 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="opacity-70">Subtotal ({items.length} item{items.length === 1 ? '' : 's'})</dt>
                <dd>KES {subtotal.toLocaleString('en-KE')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="opacity-70">Delivery</dt>
                <dd>KES {deliveryFee.toLocaleString('en-KE')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="opacity-70">Platform fee ({marginPct}%)</dt>
                <dd>KES {marginKes.toLocaleString('en-KE')}</dd>
              </div>
            </dl>
            <div className="flex justify-between pt-4 border-t border-black/10 text-lg font-semibold">
              <span>Total</span>
              <span>KES {total.toLocaleString('en-KE')}</span>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="mt-6 w-full h-14 rounded-xl bg-[var(--mt-primary)] text-white text-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {isPending ? 'Placing order…' : 'Place order'}
            </button>
            <Link
              href={`/shop/${slug}`}
              className="mt-3 block text-center text-sm text-[var(--mt-primary)] underline underline-offset-4"
            >
              Keep browsing
            </Link>
          </div>
        </aside>
      </form>
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
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label className="block text-xs uppercase tracking-wider mb-1.5 opacity-70">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full h-11 px-3 rounded-md border border-black/20 bg-white"
      />
    </div>
  );
}
