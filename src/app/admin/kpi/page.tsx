export const dynamic = 'force-dynamic';

export default function AdminKpiPage() {
  const metrics = [
    { label: 'Conversion rate', value: '—' },
    { label: 'Avg order value', value: '—' },
    { label: 'Cross-sell attach %', value: '—' },
    { label: 'Delivery on-time %', value: '—' },
    { label: 'Incident rate', value: '—' },
    { label: 'Card scan → purchase', value: '—' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold tracking-widest uppercase text-ochre-600">
          Analytics
        </p>
        <h1 className="font-display text-4xl text-teal-900 mt-1">KPI</h1>
        <p className="mt-2 text-teal-900/60 text-sm">
          Cooperative-wide health metrics — wiring up soon.
        </p>
      </header>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <li
            key={m.label}
            className="rounded-2xl border border-teal-900/10 bg-sand-50 p-5"
          >
            <p className="text-[11px] tracking-wider uppercase text-teal-900/50 font-semibold">
              {m.label}
            </p>
            <p className="mt-2 font-display text-4xl text-teal-900/40 leading-none">
              {m.value}
            </p>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border border-dashed border-teal-900/15 bg-sand-50 p-8 text-center">
        <p className="text-sm text-teal-900/50">
          Charts &amp; trendlines will render here once orders start flowing.
        </p>
      </div>
    </div>
  );
}
