// api/_lib/sources/thirteenf.js
// 13F HOLDINGS source — institutional funds report a POSITION SNAPSHOT each quarter (a value +
// share count per holding), not individual trades. This adapter returns raw holding facts for
// the poll loop to screen + upsert (each becomes a disclosure row carrying `position_value`),
// so fund composition weights by the reported holding value — exact, never a sum of re-files.
//
// STATUS: real fetch is scaffolded but OFF until wired. It needs:
//   1. FMP_API_KEY (same key as prices/PTRs), and
//   2. a fund → CIK map (13F filings are keyed by the fund's SEC CIK, not its name).
// With neither, fetchFundHoldings() returns [] and the app keeps using seeded/sample funds —
// never fabricated positions.
//
// FMP endpoint (per fund, per quarter):
//   GET /api/v3/form-thirteen/{cik}?date=YYYY-MM-DD   -> [{ tickercusip|symbol, nameOfIssuer,
//                                                          value, shares, ... }]
// The `value` is the reported market value of the position (USD) — that becomes position_value.
const HOST = 'https://financialmodelingprep.com';

// Fund name -> SEC CIK. Fill this in to turn a fund on. (CIKs are stable, public identifiers.)
const FUND_CIK = {
  // 'Renaissance Technologies': '0001037389',
  // 'Berkshire Crest Fund': '...',
};

const num = (v) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

async function getJson(url) {
  const key = process.env.FMP_API_KEY;
  if (!key) throw new Error('FMP_API_KEY not set');
  const full = url + (url.includes('?') ? '&' : '?') + 'apikey=' + key;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(full, { headers: { accept: 'application/json' }, signal: ctrl.signal });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    const emsg = data && !Array.isArray(data) && data['Error Message'];
    if (res.status === 429 || (emsg && /limit|rate/i.test(emsg))) {
      const e = new Error(emsg || 'rate limit');
      e.code = 'RATE_LIMIT';
      throw e;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}${emsg ? ' ' + emsg : ''}`);
    if (emsg) throw new Error(emsg);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

/** Latest 13F holdings for one fund (by CIK) as raw holding facts. */
async function fetchOneFund(actor, cik) {
  const raw = await getJson(`${HOST}/api/v3/form-thirteen/${encodeURIComponent(cik)}`);
  const arr = Array.isArray(raw) ? raw : [];
  const filingDate = arr[0]?.date || arr[0]?.fillingDate || null;
  return arr
    .map((h) => {
      const ticker = String(h.symbol || h.tickercusip || '').trim().toUpperCase();
      const value = num(h.value);
      if (!ticker || value == null) return null;
      return {
        actor,
        kind: '13F Fund',
        source: '13F-HR',
        side: 'BUY', // a reported position (held); an exited name simply drops out of the filing
        ticker,
        company: h.nameOfIssuer || ticker,
        amountMid: value, // keep amountMid in sync so legacy paths still work
        positionValue: value, // the authoritative reported holding value
        shares: num(h.shares),
        filingDate,
        transactionDate: filingDate,
      };
    })
    .filter(Boolean);
}

/**
 * Fetch reported 13F holdings across the configured funds. Returns [] when no key / no funds are
 * configured (the honest default) so nothing is fabricated. On a rate-limit it stops early and
 * returns what it has.
 */
export async function fetchFundHoldings() {
  if (!process.env.FMP_API_KEY) return [];
  const funds = Object.entries(FUND_CIK);
  if (!funds.length) return [];
  const out = [];
  for (const [actor, cik] of funds) {
    try {
      out.push(...(await fetchOneFund(actor, cik)));
    } catch (e) {
      if (e.code === 'RATE_LIMIT') break; // quota spent — keep what we have
      // otherwise skip this fund; a bad CIK shouldn't sink the batch
    }
  }
  return out;
}
