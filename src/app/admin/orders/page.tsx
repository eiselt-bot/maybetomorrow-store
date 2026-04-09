export const dynamic = 'force-dynamic';

export default function AdminOrdersPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold tracking-widest uppercase text-ochre-600">
          Operations
        </p>
        <h1 className="font-display text-4xl text-teal-900 mt-1">Orders</h1>
        <p className="mt-2 text-teal-900/60 text-sm">
          All customer orders across every shop.
        </p>
      </header>

      <div className="rounded-2xl border border-dashed border-teal-900/15 bg-sand-50 p-16 text-center">
        <p className="font-display text-2xl text-teal-900">No orders yet</p>
        <p className="mt-2 text-sm text-teal-900/50 max-w-sm mx-auto">
          The first order from any shop will appear here with full tracking:
          customer, items, driver, and status timeline.
        </p>
      </div>
    </div>
  );
}
