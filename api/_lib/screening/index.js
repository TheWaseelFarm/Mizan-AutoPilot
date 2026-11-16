// api/_lib/screening/index.js
// Screening resolver + cache. Picks the live adapter when its key is set, otherwise falls back
// to the mock adapter so the app keeps working without a key.
//
// Provider is chosen by SCREENING_PROVIDER ("halalterminal" (default) | "zoya" | "edgar").
// Halal Terminal is the v1 provider (spec §7); Zoya is kept as an alternative adapter. Both need
// SCREENING_API_KEY. "edgar" computes the ratios from the company's own 10-K (SEC EDGAR) and
// needs SEC_USER_AGENT + TWELVEDATA_API_KEY instead — see ./edgar.js.
//
// Every adapter returns RAW inputs (business activity, impure %, debt %, cash %) — NEVER a
// vendor pass/fail verdict. AAOIFI (api/_lib/aaoifi.js) is the only thing that decides the
// verdict; it is not touched here.
import { screen as edgarScreen } from "./edgar.js";
import { screen as halalTerminalScreen } from "./halalterminal.js";
import { screen as mockScreen } from "./mock.js";
import { screen as zoyaScreen } from "./zoya.js";

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

const LIVE_ADAPTERS = { halalterminal: halalTerminalScreen, zoya: zoyaScreen };

const set = (k) => !!String(process.env[k] || "").trim();
export const screeningProvider = () => String(process.env.SCREENING_PROVIDER || "halalterminal").toLowerCase();
const usingEdgar = () => screeningProvider() === "edgar" && set("SEC_USER_AGENT") && set("TWELVEDATA_API_KEY");
export const usingLiveScreener = () => usingEdgar() || (screeningProvider() !== "edgar" && set("SCREENING_API_KEY"));
export function activeScreener() {
  if (!usingLiveScreener()) return mockScreen;
  if (usingEdgar()) return edgarScreen;
  return LIVE_ADAPTERS[screeningProvider()] || halalTerminalScreen;
}

// Inert "unscreened" payload. Reasoning starts with the "No screening data" marker so
// api/feed.js derives screened:false (grey Unscreened state) even without a DB column.
export function unscreened(detail) {
  return {
    screened: false,
    business: "Unscreened",
    businessStatus: "watch",
    impurePct: 0,
    debtRatio: 0,
    cashPct: 0,
    reasoning: "No screening data available" + (detail ? ` (${detail})` : "") +
      " for this ticker — flagged for manual review.",
    purification: null,
  };
}

// Screen a ticker once. 404/no-data and transient failures degrade to unscreened
// (never fabricate compliant zeros as facts).
export async function screenOnce(ticker) {
  try {
    const out = await activeScreener()(ticker);
    return out || unscreened();
  } catch (e) {
    return unscreened(`screening temporarily unavailable: ${e.message}`);
  }
}

// Cache-aware screen used by the poll loop. Reads the `screenings` table (refresh only if
// older than 30 days); tolerates the table being absent so the app works before the
// migration is run.
export async function screenCached(db, ticker) {
  try {
    const { data, error } = await db
      .from("screenings").select("payload,fetched_at").eq("ticker", ticker).maybeSingle();
    if (!error && data && data.payload && data.fetched_at &&
        (Date.now() - Date.parse(data.fetched_at) < THIRTY_DAYS)) {
      return data.payload;
    }
  } catch (e) { /* table missing/unreachable -> screen live */ }

  const payload = await screenOnce(ticker);
  try {
    await db.from("screenings").upsert(
      { ticker, payload, fetched_at: new Date().toISOString() },
      { onConflict: "ticker" }
    );
  } catch (e) { /* cache write is best-effort */ }
  return payload;
}
