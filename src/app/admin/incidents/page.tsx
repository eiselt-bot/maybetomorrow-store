export const dynamic = 'force-dynamic';

export default function AdminIncidentsPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold tracking-widest uppercase text-ochre-600">
          Trust & Safety
        </p>
        <h1 className="font-display text-4xl text-teal-900 mt-1">Incidents</h1>
        <p className="mt-2 text-teal-900/60 text-sm">
          Yellow and red cards for vendors and drivers.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-ochre-400/30 bg-ochre-400/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ochre-600">
            Yellow cards
          </p>
          <p className="mt-2 font-display text-5xl text-teal-900">0</p>
          <p className="mt-2 text-xs text-teal-900/50">First warnings</p>
        </div>
        <div className="rounded-2xl border border-terracotta-500/30 bg-terracotta-500/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-terracotta-600">
            Red cards
          </p>
          <p className="mt-2 font-display text-5xl text-teal-900">0</p>
          <p className="mt-2 text-xs text-teal-900/50">Removed from platform</p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-teal-900/15 bg-sand-50 p-12 text-center">
        <p className="font-display text-xl text-teal-900">No incidents yet</p>
        <p className="mt-1 text-sm text-teal-900/50">
          A clean slate — let&apos;s keep it that way.
        </p>
      </div>
    </div>
  );
}
