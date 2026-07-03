// api/_lib/sources/fmp.js
// FREE congressional-disclosure source via Financial Modeling Prep (FMP).
// Needs a free FMP key in env: FMP_API_KEY  (no credit card; 250 calls/day).
// Pulls latest Senate + House disclosures (2 calls per poll) -> keep cadence >= 15 min.
//
// To use: in api/poll-disclosures.js change the source import to:
//     import { fetchNewDisclosures } from "./_lib/sources/fmp.js";
 
const BASE = "https://financialmodelingprep.com/stable";
const LOOKBACK_DAYS = 45;   // STOCK Act window
const MAX_ROWS = 60;
 
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
 
function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d)) return "";
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2,"0")}, ${d.getFullYear()}`;
}
function dateObj(s){ const d = new Date(s); return isNaN(d) ? null : d; }
function initialsOf(name){
  const p = String(name||"").trim().split(/\s+/);
  return ((p[0]?.[0]||"") + (p[p.length-1]?.[0]||"")).toUpperCase() || "PO";
}
function midpoint(amount){
  const nums = String(amount||"").match(/[\d,]+/g);
  if(!nums) return null;
  const v = nums.map(n=>Number(n.replace(/,/g,"")));
  return v.length>=2 ? Math.round((v[0]+v[1])/2) : (v[0]??null);
}
 
async function fetchChamber(path, chamberSource){
  const key = process.env.FMP_API_KEY;
  if(!key) throw new Error("FMP_API_KEY not set");
  const res = await fetch(`${BASE}/${path}?page=0&apikey=${key}`, { headers:{accept:"application/json"} });
  if(!res.ok) throw new Error(`FMP ${path} HTTP ${res.status}`);
  const data = await res.json();
  if(!Array.isArray(data)) throw new Error(`FMP ${path}: ${data?.["Error Message"] || "unexpected response"}`);
  return data.map(r => ({ ...r, __source: chamberSource }));
}
 
export async function fetchNewDisclosures(){
  // pull both chambers; if one fails, keep the other
  const results = await Promise.allSettled([
    fetchChamber("senate-latest", "Senate PTR"),
    fetchChamber("house-latest",  "House PTR"),
  ]);
  const raw = results.flatMap(r => r.status === "fulfilled" ? r.value : []);
  if(!raw.length){
    const err = results.find(r=>r.status==="rejected");
    throw new Error(err ? err.reason.message : "FMP returned no data");
  }
 
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);
 
  const rows = [];
  for(const t of raw){
    const ticker = String(t.symbol || t.ticker || "").trim().toUpperCase();
    if(!ticker || ticker === "--" || !/[A-Z]/.test(ticker)) continue;
 
    const filedRaw = t.disclosureDate || t.dateRecieved || t.date || t.filingDate;
    const filed = dateObj(filedRaw);
    if(filed && filed < cutoff) continue;
 
    const typeStr = String(t.type || t.transactionType || "").toLowerCase();
    const side = typeStr.includes("sale") || typeStr.includes("sell") ? "SELL" : "BUY";
 
    const name = t.representative
      || [t.firstName, t.lastName].filter(Boolean).join(" ")
      || t.office || "Public Official Filing";
 
    rows.push({
      actor: name,
      kind: "Congress",
      initials: initialsOf(name),
      source: t.__source,
      side,
      ticker,
      company: t.assetDescription || ticker,
      sector: "",
      amount: t.amount || "",
      amountMid: midpoint(t.amount),
      shares: null,
      sharesLabel: "Not disclosed",
      transactionDate: fmtDate(t.transactionDate),
      filingDate: fmtDate(filedRaw),
      purchasePrice: 0,
      fallbackPrice: 0,
      alert: `Disclosed ${side} of ${ticker}`,
      confidence: "—"
    });
  }
 
  rows.sort((a,b)=>(dateObj(b.filingDate)||0)-(dateObj(a.filingDate)||0));
  return rows.slice(0, MAX_ROWS);
}
 








