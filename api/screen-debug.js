// GET /api/screen-debug?secret=CRON_SECRET&ticker=AAPL
// TEMPORARY diagnostic (remove once the adapter field paths are verified).
// Returns the RAW screening-provider response for ONE ticker so the exact JSON field paths
// (debt %, cash %, impure %, business-activity status) can be confirmed before finalizing
// the halalterminal.js / zoya.js field mapping. Secret-protected; NEVER echoes an env secret.
import { requireCron } from "./_lib/cron.js";

export default async function handler(req, res) {
  if (!requireCron(req, res)) return;

  const key = process.env.SCREENING_API_KEY;
  if (!key) {
    return res.status(200).json({ ok: false, error: "SCREENING_API_KEY is not set on this deployment — add it in Vercel env vars and redeploy." });
  }
  const ticker = (String(req.query.ticker || "AAPL").toUpperCase().replace(/[^A-Z.\-]/g, "").slice(0, 8)) || "AAPL";
  const provider = String(process.env.SCREENING_PROVIDER || "halalterminal").toLowerCase();
  const base = process.env.SCREENING_API_BASE || (provider === "zoya" ? "https://api.zoya.finance" : "https://api.halalterminal.com");
  const url = provider === "zoya" ? `${base}/graphql` : `${base}/api/screen/${encodeURIComponent(ticker)}`;

  try {
    const r = provider === "zoya"
      ? await fetch(url, { method: "POST", headers: { "content-type": "application/json", "x-api-key": key }, body: JSON.stringify({ query: "query($s:String!){advancedCompliance(symbol:$s){__typename}}", variables: { s: ticker } }) })
      : await fetch(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json", "X-API-Key": key }, body: "{}" });
    const text = await r.text();
    let json; try { json = JSON.parse(text); } catch { json = null; }
    return res.status(200).json({
      ok: r.ok, http: r.status, provider, ticker, url,
      raw: json != null ? json : String(text).slice(0, 4000),
    });
  } catch (e) {
    return res.status(200).json({ ok: false, provider, ticker, url, error: String(e.message || e).slice(0, 300) });
  }
}
