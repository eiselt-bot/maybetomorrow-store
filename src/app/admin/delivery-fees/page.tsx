import Link from 'next/link';
import { db, schema } from '@/lib/db/client';
import { updateDeliveryFeeForm } from '@/app/actions/shop-admin';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DeliveryFeesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const rows = await db
    .select()
    .from(schema.deliveryFees)
    .orderBy(schema.deliveryFees.feeKes);

  const savedZone = typeof sp.saved === 'string' ? sp.saved : null;
  const errorMsg = typeof sp.error === 'string' ? sp.error : null;

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <p className="text-xs font-semibold tracking-widest uppercase text-ochre-600">
          Operations
        </p>
        <h1 className="font-display text-4xl text-teal-900 mt-1">Delivery Fees</h1>
        <p className="mt-2 text-sm text-teal-900/60 max-w-2xl">
          Per-zone flat fee added to every order. Changes apply instantly to
          checkout for all 5 shops.
        </p>
      </header>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {errorMsg}
        </div>
      )}
      {savedZone && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Saved <strong>{savedZone}</strong>.
        </div>
      )}

      <div className="space-y-4">
        {rows.map((r) => (
          <form
            key={r.zone}
            action={updateDeliveryFeeForm}
            className="rounded-2xl border border-teal-900/10 bg-white p-5 flex items-end gap-4"
          >
            <input type="hidden" name="zone" value={r.zone} />

            <div className="flex-1">
              <label className="block text-[10px] font-semibold tracking-widest uppercase text-teal-900/50 mb-1">
                Zone
              </label>
              <p className="font-mono text-sm text-teal-900/60">{r.zone}</p>
            </div>

            <div className="w-48">
              <label className="block text-[10px] font-semibold tracking-widest uppercase text-teal-900/50 mb-1">
                Label
              </label>
              <input
                type="text"
                name="label"
                defaultValue={r.label}
                required
                className="w-full h-10 px-3 rounded-lg border border-teal-900/15 bg-white text-sm focus:border-ochre-500 focus:outline-none focus:ring-2 focus:ring-ochre-400/30 transition"
              />
            </div>

            <div className="w-40">
              <label className="block text-[10px] font-semibold tracking-widest uppercase text-teal-900/50 mb-1">
                Fee (KES)
              </label>
              <input
                type="number"
                name="feeKes"
                defaultValue={r.feeKes}
                min={0}
                step={50}
                required
                className="w-full h-10 px-3 rounded-lg border border-teal-900/15 bg-white text-sm tabular-nums focus:border-ochre-500 focus:outline-none focus:ring-2 focus:ring-ochre-400/30 transition"
              />
            </div>

            <button
              type="submit"
              className="h-10 inline-flex items-center rounded-lg bg-ochre-500 px-4 text-sm font-semibold text-white shadow-sm hover:bg-ochre-600 transition"
            >
              Save
            </button>
          </form>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-teal-900/15 bg-sand-50 p-4 text-xs text-teal-900/60">
        <strong>Tip:</strong> Changes take effect immediately on new orders.
        Existing orders keep the fee they were charged at the time of
        placement. Fees are cached in the app — a redeploy will also refresh.
      </div>
    </div>
  );
}
