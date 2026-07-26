// api/status.js — data-readiness probe. READ-ONLY and SAFE: it reports table counts,
// freshness timestamps and which integrations are configured as BOOLEANS only — it never
// returns a secret value. Answers the one operational question at a glance:
//   "Is the app serving REAL data, or the embedded sample / pending state?"
//
// Hit it on your phone: https://<app>.vercel.app/api/status
import { supabase } from "./_lib/supabase.js";

const has = (k) => !!(process.env[k] && String(process.env[k]).trim());

export default async function handler(_req, res) {
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=120");

  const config = {
    supabase: has("SUPABASE_URL") && has("SUPABASE_SERVICE_ROLE_KEY"),
    fmp: has("FMP_API_KEY"),                 // real disclosures (SEC/Congress) + real prices
    quiver: has("QUIVER_API_KEY"),
    screening: has("SCREENING_API_KEY"),     // real AAOIFI screening (Zoya / Halal Terminal)
    screeningProvider: process.env.SCREENING_PROVIDER || (has("SCREENING_API_KEY") ? "(configured)" : "mock"),
    cronSecret: has("CRON_SECRET"),
  };
  const out = { ok: true, time: new Date().toISOString(), config };

  if (!config.supabase) {
    out.ready = false;
    out.servingSample = true;
    out.summary = "Supabase is not configured — the app is serving embedded SAMPLE data only. Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, apply supabase/schema.sql, then run the crons.";
    return res.status(200).json(out);
  }

  const db = supabase();
  // Tolerant helpers: a missing table / column degrades to null instead of failing the probe.
  const count = async (table, mod) => {
    try { let q = db.from(table).select("*", { count: "exact", head: true }); if (mod) q = mod(q); const { count: c, error } = await q; return error ? null : (c || 0); }
    catch { return null; }
  };
  const latest = async (table, col) => {
    try { const { data, error } = await db.from(table).select(col).order(col, { ascending: false }).limit(1); return error ? null : (data && data[0] ? data[0][col] : null); }
    catch { return null; }
  };

  try {
    const [disclosures, screened, clean, purify, fail, prices, screenings, follows] = await Promise.all([
      count("disclosures"),
      count("disclosures", (q) => q.not("business_status", "is", null)),
      count("disclosures", (q) => q.eq("label", "clean")),
      count("disclosures", (q) => q.eq("label", "purify")),
      count("disclosures", (q) => q.eq("label", "fail")),
      count("prices"),
      count("screenings"),
      count("follows"),
    ]);
    const [latestDisclosure, latestPrice, latestScreen] = await Promise.all([
      latest("disclosures", "created_at"),
      latest("prices", "updated_at"),
      latest("screenings", "fetched_at"),
    ]);

    out.data = {
      disclosures: { total: disclosures, screened, byVerdict: { clean, purify, fail }, latest: latestDisclosure },
      prices: { tickers: prices, latest: latestPrice },
      screenings: { cached: screenings, latest: latestScreen },
      follows,
    };

    const realDisclosures = (disclosures || 0) > 0;
    const realPrices = (prices || 0) > 0;
    const realScreening = config.screening && (screenings || 0) > 0;
    out.ready = realDisclosures;
    out.servingSample = !realDisclosures;
    out.readiness = { realDisclosures, realPrices, realScreening };

    const notes = [];
    if (!realDisclosures) notes.push("No disclosures cached — the app falls back to embedded SAMPLE data. Run /api/poll-disclosures?secret=CRON_SECRET (needs FMP_API_KEY) to ingest real filings.");
    if (realDisclosures && !realPrices) notes.push("No prices cached — returns show 'indicative' and charts read 'Pending' until /api/refresh-prices?secret=CRON_SECRET runs (needs FMP_API_KEY).");
    if (realDisclosures && !config.screening) notes.push("SCREENING_API_KEY unset — verdicts use the MOCK screening adapter. Set the key (Zoya / Halal Terminal) for real AAOIFI ratios, then /api/rescreen.");
    out.summary = realDisclosures
      ? `Serving REAL data: ${disclosures} disclosures (${screened ?? "?"} screened), ${prices ?? 0} price series cached.`
      : "Not serving real data yet — see notes.";
    out.notes = notes;
    return res.status(200).json(out);
  } catch (e) {
    out.ok = false;
    out.ready = false;
    out.error = e.message;
    out.summary = "Supabase is configured but unreachable, or the schema is missing — apply supabase/schema.sql and check the service-role key.";
    return res.status(200).json(out);
  }
}
