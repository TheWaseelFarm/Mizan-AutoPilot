// api/_lib/sources/housewatcher.js
// FREE congressional-disclosure source (House Stock Watcher public data).
// No API key required. Same data Quiver repackages — good enough to prove the idea.
// Feed: community-maintained public S3 JSON of all House PTR transactions.
//
// To use: in api/poll-disclosures.js change
//     import { fetchNewDisclosures } from "./_lib/sources/mock.js";
//   to
//     import { fetchNewDisclosures } from "./_lib/sources/housewatcher.js";
 
const FEED = "https://house-stock-watcher-data.s3-us-west-2.amazonaws.com/data/all_transactions.json";
 
// Only ingest recent filings so we don't import years of history on every poll.
const LOOKBACK_DAYS = 45;   // STOCK Act disclosure window
const MAX_ROWS = 60;        // safety cap per poll
 
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
 
// "2026-06-17" or "06/17/2026" -> "Jun 17, 2026"  (returns null if unparseable)
function fmtDate(s) {
  if (!s || s === "--") return null;
  let y, m, d;
  if (s.includes("-")) { [y, m, d] = s.split("-").map(Number); }
  else if (s.includes("/")) { [m, d, y] = s.split("/").map(Number); }
  else return null;
  if (!y || !m || !d) return null;
  return `${MONTHS[m - 1]} ${String(d).padStart(2, "0")}, ${y}`;
}
function toDateObj(s) {
  if (!s || s === "--") return null;
  if (s.includes("-")) { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); }
  if (s.includes("/")) { const [m,d,y] = s.split("/").map(Number); return new Date(y, m-1, d); }
  return null;
}
function initialsOf(name) {
  const parts = String(name || "").replace(/(Hon\.|Mr\.|Mrs\.|Ms\.|Dr\.)/g, "").trim().split(/\s+/);
  const a = (parts[0] || "").charAt(0);
  const b = (parts[parts.length - 1] || "").charAt(0);
  return (a + b).toUpperCase() || "PO";
}
// amount range string -> midpoint number (e.g. "$1,001 - $15,000" -> 8000)
function midpoint(amount) {
  if (!amount) return null;
  const nums = String(amount).match(/[\d,]+/g);
  if (!nums || !nums.length) return null;
  const vals = nums.map(n => Number(n.replace(/,/g, "")));
  if (vals.length >= 2) return Math.round((vals[0] + vals[1]) / 2);
  return vals[0];
}
 
export async function fetchNewDisclosures() {
  const res = await fetch(FEED, { headers: { "accept": "application/json" } });
  if (!res.ok) throw new Error(`House Stock Watcher feed HTTP ${res.status}`);
  const all = await res.json();
 
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);
 
  const rows = [];
  for (const t of all) {
    const ticker = (t.ticker || "").trim().toUpperCase();
    if (!ticker || ticker === "--") continue;            // skip trades with no ticker
    const filed = toDateObj(t.disclosure_date);
    if (filed && filed < cutoff) continue;                // recent filings only
    const typeRaw = String(t.type || "").toLowerCase();
    const side = typeRaw.includes("sale") ? "SELL" : "BUY";
    const rep = t.representative || "Public Official Filing";
 
    rows.push({
      actor: rep,
      kind: "Congress",
      initials: initialsOf(rep),
      source: "House PTR",
      side,
      ticker,
      company: ticker,                 // company name enriched later (price-feed step)
      sector: "",
      amount: t.amount || "",
      amountMid: midpoint(t.amount),
      shares: null,
      sharesLabel: "Not disclosed",
      transactionDate: fmtDate(t.transaction_date) || "",
      filingDate: fmtDate(t.disclosure_date) || "",
      purchasePrice: 0,                // no price yet (Demo fallback until price-feed step)
      fallbackPrice: 0,
      alert: `Disclosed ${side} of ${ticker}`,
      confidence: "—"
    });
  }
 
  // newest filings first, capped
  rows.sort((a, b) => (toDateObj(b.filingDate) || 0) - (toDateObj(a.filingDate) || 0));
  return rows.slice(0, MAX_ROWS);
}
 








