import Link from 'next/link';
import { loadShop } from '../_loaders';
import { Button } from '@/components/ui/Button';

type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Checkout form — NON-FUNCTIONAL, UI only.
 * No onSubmit handler, no API action. The button is visual.
 */
export default async function CheckoutPage({ params }: PageProps) {
  const { slug } = await params;
  const { shop } = await loadShop(slug);

  return (
    <article className="max-w-3xl mx-auto px-6 py-16 font-[var(--mt-font-body)]">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--mt-primary)] mb-2">
          Checkout
        </p>
        <h1 className="font-[var(--mt-font-display)] text-4xl md:text-5xl leading-tight mb-2">
          Order from {shop.title}
        </h1>
        <p className="opacity-75">Cash on delivery. We'll call to confirm before sending.</p>
      </header>

      <form className="space-y-8" action="#" noValidate>
        <section>
          <h2 className="font-[var(--mt-font-display)] text-xl mb-4 pb-2 border-b border-black/10">
            Your contact
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" name="name" required placeholder="e.g. Amina Mwangi" />
            <Field
              label="Phone"
              name="phone"
              type="tel"
              required
              placeholder="+254 7__ ___ ___"
            />
            <Field
              label="Email (optional)"
              name="email"
              type="email"
              placeholder="you@example.com"
              wide
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
                Zone
              </label>
              <select
                name="zone"
                className="w-full h-11 px-3 rounded-md border border-black/20 bg-white focus:border-[var(--mt-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--mt-primary)]/30"
                defaultValue="diani-strip"
              >
                <option value="diani-strip">Diani Strip</option>
                <option value="south-coast">South Coast</option>
                <option value="mombasa">Mombasa</option>
                <option value="further">Further</option>
              </select>
            </div>
            <Field label="Delivery date" name="deliveryDate" type="date" required />
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wider mb-1.5 opacity-70">
                Delivery address
              </label>
              <textarea
                name="address"
                rows={3}
                required
                placeholder="Hotel, villa or landmark — describe so we can find you"
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
            href={`/shop/${slug}`}
            className="text-sm text-[var(--mt-primary)] underline underline-offset-4"
          >
            ← Keep browsing
          </Link>
          <Button type="button" variant="primary" size="lg">
            Place order
          </Button>
        </div>
        <p className="text-xs opacity-60 text-center">
          Demo form — not wired to the backend yet.
        </p>
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
        className="w-full h-11 px-3 rounded-md border border-black/20 bg-white focus:border-[var(--mt-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--mt-primary)]/30"
      />
    </div>
  );
}
