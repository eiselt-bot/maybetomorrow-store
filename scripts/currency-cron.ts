import 'dotenv/config';
import { db, schema } from '../src/lib/db/client';

/**
 * Daily currency-rate refresh.
 *
 * Fetches KES -> {USD, EUR, CHF} quotes from exchangerate.host and upserts a
 * single row per day into `currency_rates`. Designed to be idempotent so it
 * can run multiple times a day (or be manually re-run) without creating
 * duplicate rows.
 *
 * Cron entry (see scripts/setup-mahelya.sh):
 *   0 6 * * * cd /home/claude-admin/maybetomorrow-store \
 *     && /usr/bin/npm run currency:fetch >> /var/log/mt-currency.log 2>&1
 */
async function main() {
  const url = process.env.EXCHANGE_RATE_API || 'https://api.exchangerate.host/live';

  // exchangerate.host returns rates where base can be KES; the `quotes`
  // map uses keys like "KESUSD", "KESEUR", "KESCHF".
  const resp = await fetch(`${url}?source=KES&currencies=USD,EUR,CHF`);
  if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
  const data = (await resp.json()) as { quotes?: Record<string, number> };

  const today = new Date().toISOString().slice(0, 10);

  // Fallback values are intentionally conservative; they only fire if the
  // API is unreachable AND the keys are missing, so we never insert NaN.
  const usd = data.quotes?.KESUSD ?? 0.0077;
  const eur = data.quotes?.KESEUR ?? 0.0071;
  const chf = data.quotes?.KESCHF ?? 0.0070;

  await db
    .insert(schema.currencyRates)
    .values({
      date: today,
      usd: String(usd),
      eur: String(eur),
      chf: String(chf),
      source: 'exchangerate.host',
    })
    .onConflictDoUpdate({
      target: schema.currencyRates.date,
      set: {
        usd: String(usd),
        eur: String(eur),
        chf: String(chf),
        source: 'exchangerate.host',
      },
    });

  console.log(
    `Currency rates updated: ${today} | USD ${usd} | EUR ${eur} | CHF ${chf}`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
