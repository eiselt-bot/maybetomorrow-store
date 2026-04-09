export const dynamic = 'force-dynamic';

export default function AdminPayoutsPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold tracking-widest uppercase text-ochre-600">
          Finance
        </p>
        <h1 className="font-display text-4xl text-teal-900 mt-1">Payouts</h1>
        <p className="mt-2 text-teal-900/60 text-sm">
          M-Pesa settlements to vendors after delivery confirmation.
        </p>
      </header>

      <div className="rounded-2xl border border-dashed border-teal-900/15 bg-sand-50 p-16 text-center">
        <p className="font-display text-2xl text-teal-900">No payouts yet</p>
        <p className="mt-2 text-sm text-teal-900/50 max-w-sm mx-auto">
          Once the first delivery is confirmed, net payouts will be calculated
          automatically and queued here for settlement.
        </p>
      </div>
    </div>
  );
}
