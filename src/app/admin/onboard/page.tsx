export const dynamic = 'force-dynamic';

export default function AdminOnboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold tracking-widest uppercase text-ochre-600">
          Vendor intake
        </p>
        <h1 className="font-display text-4xl text-teal-900 mt-1">Onboard</h1>
        <p className="mt-2 text-teal-900/60 text-sm">
          Bring a new beach vendor into the cooperative.
        </p>
      </header>

      <div className="rounded-3xl border border-teal-900/10 bg-gradient-to-br from-ochre-400/10 via-sand-100 to-teal-500/5 p-10">
        <p className="font-display text-3xl text-teal-900">
          Onboarding PWA coming soon
        </p>
        <p className="mt-3 text-teal-900/60 max-w-lg">
          The field flow — photo of the vendor, brand interview, live shop
          preview, QR card print — will live here. Built mobile-first so
          Claurice can onboard a new shop in under 15 minutes on the beach.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-teal-900/70">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-ochre-500" />
            Capture vendor photo &amp; voice memo
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-ochre-500" />
            AI-assisted brand interview
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-ochre-500" />
            Live layout preview &amp; QR card printing
          </li>
        </ul>
      </div>
    </div>
  );
}
