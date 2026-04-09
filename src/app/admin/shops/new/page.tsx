import Link from 'next/link';
import { createShopForm } from '@/app/actions/shop-admin';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const LAYOUT_OPTIONS = [
  { value: 'earthy-artisan', label: 'Earthy Artisan', mood: 'Warm, grounded' },
  { value: 'vibrant-market', label: 'Vibrant Market', mood: 'Energetic, bold' },
  { value: 'ocean-calm', label: 'Ocean Calm', mood: 'Coastal, airy' },
  { value: 'heritage-story', label: 'Heritage Story', mood: 'Editorial, timeless' },
  { value: 'bold-maker', label: 'Bold Maker', mood: 'Graphic, statement' },
];

export default async function NewShopPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const errorMsg = typeof sp.error === 'string' ? sp.error : null;
  const getPrefill = (key: string) =>
    typeof sp[`f_${key}`] === 'string' ? (sp[`f_${key}`] as string) : '';

  return (
    <div className="space-y-8 pb-16 max-w-4xl">
      <div>
        <Link
          href="/admin/shops"
          className="text-xs text-teal-900/50 hover:text-ochre-500 transition inline-flex items-center gap-1"
        >
          ← All shops
        </Link>
        <h1 className="mt-1 font-display text-4xl text-teal-900">New Shop</h1>
        <p className="mt-2 text-sm text-teal-900/60 max-w-2xl">
          Create the shell for a new beach vendor. After saving you can add
          brand values, design tokens, mockups, and products from the shop
          detail page.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>Couldn&apos;t create the shop:</strong> {errorMsg}
        </div>
      )}

      <form action={createShopForm} className="space-y-8">
        {/* Basics */}
        <section className="rounded-2xl border border-teal-900/10 bg-white p-6 space-y-5">
          <h2 className="font-display text-2xl text-teal-900">Basics</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Slug"
              name="slug"
              required
              placeholder="e.g. mzizi-carvings"
              hint="Lowercase letters, numbers, dashes. Becomes the subdomain: {slug}.maybetomorrow.store"
              defaultValue={getPrefill('slug')}
            />
            <Field
              label="Title"
              name="title"
              required
              placeholder="e.g. Mzizi Carvings"
              defaultValue={getPrefill('title')}
            />
            <Field
              label="Tagline"
              name="tagline"
              placeholder="e.g. Stories sculpted in ebony."
              wide
              defaultValue={getPrefill('tagline')}
            />
          </div>
        </section>

        {/* Vendor contact */}
        <section className="rounded-2xl border border-teal-900/10 bg-white p-6 space-y-5">
          <h2 className="font-display text-2xl text-teal-900">Vendor contact</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Phone"
              name="vendorPhone"
              type="tel"
              required
              placeholder="+254 7__ ___ ___"
              defaultValue={getPrefill('vendorPhone')}
            />
            <Field
              label="M-Pesa number (optional)"
              name="vendorMpesaNumber"
              type="tel"
              placeholder="+254 7__ ___ ___"
              defaultValue={getPrefill('vendorMpesaNumber')}
            />
          </div>
        </section>

        {/* About story */}
        <section className="rounded-2xl border border-teal-900/10 bg-white p-6 space-y-5">
          <h2 className="font-display text-2xl text-teal-900">Story</h2>
          <p className="text-xs text-teal-900/60 -mt-3">
            The narrative shown on the public About page. All fields optional —
            fill in what you know now, edit later.
          </p>
          <div className="grid gap-4">
            <Field
              label="Vendor name (what we call them in copy)"
              name="aboutName"
              placeholder="e.g. Juma Ngugi"
              defaultValue={getPrefill('aboutName')}
            />
            <Textarea
              label="What they offer"
              name="aboutOffering"
              rows={2}
              placeholder="e.g. Hand-carved ebony and soapstone figures."
              defaultValue={getPrefill('aboutOffering')}
            />
            <Textarea
              label="Why they do it"
              name="aboutPurpose"
              rows={2}
              placeholder="e.g. Third generation of carvers — passing the craft on."
              defaultValue={getPrefill('aboutPurpose')}
            />
            <Textarea
              label="How they make it"
              name="aboutProduction"
              rows={2}
              placeholder="e.g. Sourced from fallen trees, worked in a shared studio on Ukunda Road."
              defaultValue={getPrefill('aboutProduction')}
            />
          </div>
        </section>

        {/* Layout picker */}
        <section className="rounded-2xl border border-teal-900/10 bg-white p-6 space-y-5">
          <h2 className="font-display text-2xl text-teal-900">Starting template</h2>
          <p className="text-xs text-teal-900/60 -mt-3">
            Pick one — you can change it later or generate mockups from brand
            values.
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {LAYOUT_OPTIONS.map((v, i) => (
              <label
                key={v.value}
                className="cursor-pointer rounded-xl border-2 border-teal-900/10 p-3 hover:border-ochre-500 has-[:checked]:border-ochre-500 has-[:checked]:bg-ochre-50 transition"
              >
                <input
                  type="radio"
                  name="layoutVariant"
                  value={v.value}
                  defaultChecked={getPrefill('layoutVariant') === v.value || (i === 0 && !getPrefill('layoutVariant'))}
                  className="sr-only"
                />
                <p className="font-display text-lg text-teal-900">{v.label}</p>
                <p className="text-[11px] text-teal-900/60">{v.mood}</p>
              </label>
            ))}
          </div>
        </section>

        {/* Submit */}
        <div className="flex items-center justify-between rounded-xl border border-teal-900/10 bg-sand-50 p-4">
          <Link
            href="/admin/shops"
            className="inline-flex items-center rounded-lg border border-teal-900/15 px-4 py-2 text-sm font-semibold text-teal-900 hover:border-ochre-500 hover:text-ochre-600 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center rounded-lg bg-ochre-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-ochre-600 transition"
          >
            Create shop
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
  placeholder,
  hint,
  wide = false,
  defaultValue = '',
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  wide?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-semibold tracking-widest uppercase text-teal-900/60 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full h-11 px-3 rounded-lg border border-teal-900/15 bg-white text-sm text-teal-900 placeholder:text-teal-900/30 focus:border-ochre-500 focus:outline-none focus:ring-2 focus:ring-ochre-400/30 transition"
      />
      {hint && <p className="mt-1 text-[11px] text-teal-900/50">{hint}</p>}
    </div>
  );
}

function Textarea({
  label,
  name,
  rows = 3,
  placeholder,
  defaultValue = '',
}: {
  label: string;
  name: string;
  rows?: number;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-widest uppercase text-teal-900/60 mb-1.5">
        {label}
      </label>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full resize-none rounded-lg border border-teal-900/15 bg-white text-sm text-teal-900 placeholder:text-teal-900/30 focus:border-ochre-500 focus:outline-none focus:ring-2 focus:ring-ochre-400/30 transition px-3 py-2"
      />
    </div>
  );
}
