// api/status.js — data-readiness probe. READ-ONLY and SAFE: it reports table counts,
// freshness timestamps and which integrations are configured as BOOLEANS only — it never
// returns a secret value. Answers the one operational question at a glance:
//   "Is the app serving REAL data, or the embedded sample / pending state?"
//
// Hit it on your phone: https://<app>.vercel.app/api/status
import { supabase } from "./_lib/supabase.js";
import { isAuthConfigured } from "./_lib/auth.js";

const has = (k) => !!(process.env[k] && String(process.env[k]).trim());

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=120");

  // TEMP screening field-path probe: /api/status?probe=AAPL&t=<token> returns the RAW provider
  // response for one ticker, so the exact adapter field paths can be confirmed before finalizing
  // the halalterminal.js / zoya.js mapping. Token-guarded; returns only public company ratios,
  // NEVER an env secret. Folded into this existing endpoint to stay under Vercel's 12-function
  // limit. Removed once the field paths are verified.
  if (req.query && req.query.probe) {
    if (req.query.t !== "mizan-htcheck-4Kp9Qx2vRt") {
      return res.status(401).json({ error: "Unauthorized — open the exact link provided." });
    }
    const pkey = process.env.SCREENING_API_KEY;
    if (!pkey) {
      return res.status(200).json({ ok: false, error: "SCREENING_API_KEY is not set on this deployment — add it in Vercel env vars and redeploy, then retry this link." });
    }
    const ticker = (String(req.query.probe).toUpperCase().replace(/[^A-Z.\-]/g, "").slice(0, 8)) || "AAPL";
    const provider = String(process.env.SCREENING_PROVIDER || "halalterminal").toLowerCase();
    const base = process.env.SCREENING_API_BASE || (provider === "zoya" ? "https://api.zoya.finance" : "https://api.halalterminal.com");
    const url = provider === "zoya" ? `${base}/graphql` : `${base}/api/screen/${encodeURIComponent(ticker)}`;
    try {
      const r = provider === "zoya"
        ? await fetch(url, { method: "POST", headers: { "content-type": "application/json", "x-api-key": pkey }, body: JSON.stringify({ query: "query($s:String!){advancedCompliance(symbol:$s){__typename}}", variables: { s: ticker } }) })
        : await fetch(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json", "X-API-Key": pkey }, body: "{}" });
      const text = await r.text();
      let json; try { json = JSON.parse(text); } catch { json = null; }
      return res.status(200).json({ ok: r.ok, http: r.status, provider, ticker, url, raw: json != null ? json : String(text).slice(0, 4000) });
    } catch (e) {
      return res.status(200).json({ ok: false, provider, ticker, url, error: String(e.message || e).slice(0, 300) });
    }
  }

  const config = {
    supabase: has("SUPABASE_URL") && has("SUPABASE_SERVICE_ROLE_KEY"),
    fmp: has("FMP_API_KEY"),                 // real disclosures (SEC/Congress) via FMP
    twelvedata: has("TWELVEDATA_API_KEY"),   // real prices (Twelve Data; FMP prices are paywalled)
    quiver: has("QUIVER_API_KEY"),
    screening: has("SCREENING_API_KEY"),     // real AAOIFI screening (Zoya / Halal Terminal)
    screeningProvider: process.env.SCREENING_PROVIDER || (has("SCREENING_API_KEY") ? "(configured)" : "mock"),
    cronSecret: has("CRON_SECRET"),
    authSecret: isAuthConfigured(),
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

    // Portfolio depth — the app groups disclosures by actor and only RANKS actors with >= 3
    // distinct holdings (the thin-data gate). This shows how many actually qualify, so "only one
    // portfolio shows" can be read as data-reality vs a bug. Counts raw rows (before the
    // screened-completeness gate), so it's an upper bound on what the app surfaces.
    let portfolios = null;
    try {
      const { data, error } = await db.from("disclosures").select("actor,ticker").limit(5000);
      if (!error && data) {
        const m = new Map();
        for (const r of data) { if (!r.actor || !r.ticker) continue; let s = m.get(r.actor); if (!s) m.set(r.actor, (s = new Set())); s.add(r.ticker); }
        const sizes = [...m.values()].map((s) => s.size);
        portfolios = { distinctActors: m.size, rankable: sizes.filter((n) => n >= 3).length, oneOrTwoHoldings: sizes.filter((n) => n < 3).length };
      }
    } catch { /* leave null */ }

    out.data = {
      disclosures: { total: disclosures, screened, byVerdict: { clean, purify, fail }, latest: latestDisclosure },
      portfolios, // { distinctActors, rankable (>=3 holdings), oneOrTwoHoldings }
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
