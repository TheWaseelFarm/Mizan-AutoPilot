// Self-test for the 13F wiring in api/poll-disclosures.js. No network: one fetch stub serves
// Quiver, SEC EDGAR, OpenFIGI and Supabase/PostgREST from fixtures. Proves the flag-off path is
// unchanged and the flag-on path ingests + change-detects 13F snapshots.
// Run: npm test  — or: node test/poll13f.test.js
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import poll from "../api/poll-disclosures.js";

const FX = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "edgar13f");
const fx = (f) => fs.readFileSync(path.join(FX, f), "utf8");
const FIGI = JSON.parse(fx("openfigi.json"));
const ARCH = "https://www.sec.gov/Archives/edgar/data/2026053/000117266126003790";
const SEC = {
  "https://data.sec.gov/submissions/CIK0002026053.json": fx("pershing-submissions.json"),
  [`${ARCH}/index.json`]: fx("pershing-index.json"),
  [`${ARCH}/infotable.xml`]: fx("pershing-infotable.xml"),
};
const CONGRESS = [{
  Representative: "Jane Doe", Ticker: "NVDA", Transaction: "Purchase", House: "Representatives",
  Range: "$1,001 - $15,000", TransactionDate: "2026-09-20", ReportDate: new Date().toISOString().slice(0, 10),
}];

let pass = 0;
const secret = "test-secret-with-at-least-16-characters";
const json = (body, status = 200, headers = {}) =>
  new Response(body == null ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

// World state for the stub.
let world;
function reset({ quiver = [], quiverStatus = 200, stored13F = 0 } = {}) {
  world = { quiver, quiverStatus, stored13F, calls: [], upserts: [], nextId: 1 };
}
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  url = String(url);
  const method = (init.method || "GET").toUpperCase();
  world.calls.push({ url, method, init });
  if (url.startsWith("https://api.quiverquant.com")) {
    if (!url.includes("congresstrading")) return json({ error: "forbidden" }, 403);
    return world.quiverStatus === 200 ? json(world.quiver) : json({ error: "boom" }, world.quiverStatus);
  }
  if (url.startsWith("https://data.sec.gov") || url.startsWith("https://www.sec.gov")) {
    return SEC[url] != null ? new Response(SEC[url], { status: 200 }) : new Response("not found", { status: 404 });
  }
  if (url === "https://api.openfigi.com/v3/mapping") {
    return json(JSON.parse(init.body).map((j) => FIGI[j.idValue] || { warning: "No identifier found." }));
  }
  const u = new URL(url);
  assert.equal(u.origin, process.env.SUPABASE_URL, `unexpected request ${url}`);
  const table = u.pathname.replace("/rest/v1/", "");
  if (method === "HEAD" && table === "disclosures") return json(null, 200, { "content-range": `*/${world.stored13F}` });
  if (table === "disclosures" && method === "POST") {
    const body = JSON.parse(init.body);
    world.upserts.push({ body, prefer: new Headers(init.headers).get("Prefer") || "" });
    return json([{ id: world.nextId++ }], 201);
  }
  return json([]); // screenings cache miss / follows: none / screenings upsert
};

function env(extra) {
  for (const k of ["ENABLE_13F", "SEC_USER_AGENT", "SCREENING_API_KEY", "OPENFIGI_API_KEY", "SEC13F_TOP_N", "SEC13F_FUNDS_PER_RUN"]) delete process.env[k];
  Object.assign(process.env, {
    CRON_SECRET: secret, QUIVER_API_KEY: "test", QUIVER_SOURCES: "congress,insiders,sec13f",
    SUPABASE_URL: "https://database-test.invalid", SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
    SEC_MIN_INTERVAL_MS: "0", SEC13F_MAX_AGE_DAYS: "100000",
  }, extra);
}
async function run(query = {}) {
  const res = {
    code: undefined, body: undefined,
    status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; },
  };
  await poll({ method: "GET", headers: {}, query: { secret, ...query } }, res);
  assert.equal(res.code, 200);
  return res.body;
}
const secHits = () => world.calls.filter((c) => /sec\.gov/.test(c.url));

try {
  // A) Flag OFF: exact legacy response, no SEC traffic, congressional row written as before.
  env({});
  reset({ quiver: CONGRESS });
  let body = await run();
  assert.deepEqual(body, { ok: true, source: "quiver", checked: 1, inserted: 1, notified: 0 });
  assert.equal(secHits().length, 0);
  assert.equal(world.upserts.length, 1);
  assert.equal("position_value" in world.upserts[0].body, false, "congress row: no position_value key");
  assert.match(world.upserts[0].prefer, /ignore-duplicates/);
  pass++;

  // B) Flag OFF + source error: unchanged early-exit response.
  reset({ quiverStatus: 500 });
  body = await run();
  assert.deepEqual(Object.keys(body).sort(), ["checked", "detail", "inserted", "ok", "skipped", "source"]);
  assert.equal(body.ok, false);
  assert.equal(body.skipped, "source_error");
  pass++;

  // C) Flag ON without SEC_USER_AGENT: congress still ingested, 13F reports the clear error.
  env({ ENABLE_13F: "1" });
  reset({ quiver: CONGRESS });
  body = await run();
  assert.equal(body.inserted, 1);
  assert.match(body.sec13f.error, /SEC_USER_AGENT not set/);
  assert.equal(secHits().length, 0);
  pass++;

  // D) Flag ON: Pershing ingested with position_value; other curated funds 404 here -> reported.
  env({ ENABLE_13F: "1", SEC_USER_AGENT: "Mizan test suite (contact via repo owner)" });
  reset({ quiver: CONGRESS });
  body = await run();
  assert.equal(body.ok, true);
  assert.equal(body.sec13f.ingested.length, 1);
  assert.equal(body.sec13f.ingested[0].actor, "Pershing Square");
  assert.equal(body.inserted, 1 + 13);
  const uber = world.upserts.find((u) => u.body.ticker === "UBER").body;
  assert.equal(uber.dedupe_key, "SEC 13F|Pershing Square|UBER|Jun 30, 2026|BUY");
  assert.equal(uber.position_value, 2476978592);
  assert.equal(uber.amount_mid, 2476978592);
  assert.equal(uber.kind, "13F Fund");
  assert.equal(uber.filing_date, "Aug 14, 2026");
  assert.equal(body.sec13f.errors.length, 11, "11 other curated funds unreachable in the stub");
  const head = world.calls.find((c) => c.method === "HEAD");
  const hq = new URL(head.url).searchParams;
  assert.equal(hq.get("source"), "eq.SEC 13F");
  assert.equal(hq.get("actor"), "eq.Pershing Square");
  assert.equal(hq.get("filing_date"), "eq.Aug 14, 2026");
  pass++;

  // E) Same filing already stored: only the submissions check runs — no info table, no OpenFIGI.
  reset({ stored13F: 13 });
  body = await run();
  assert.equal(body.sec13f.upToDate, 1);
  assert.equal(body.sec13f.ingested.length, 0);
  assert.equal(world.calls.some((c) => c.url.includes("infotable") || c.url.includes("openfigi")), false);
  assert.equal(body.inserted, 0);
  pass++;

  // F) ?refresh13f=1 bypasses the stored check (finish an interrupted ingest).
  reset({ stored13F: 13 });
  body = await run({ refresh13f: "1" });
  assert.equal(body.sec13f.ingested.length, 1);
  pass++;

  // G) Flag ON + congressional source down: 13F still ingests; error surfaced in the body.
  reset({ quiverStatus: 500 });
  body = await run();
  assert.equal(body.ok, false);
  assert.equal(body.skipped, "source_error");
  assert.equal(body.inserted, 13);
  pass++;
} finally {
  globalThis.fetch = realFetch;
}

console.log(`Poll 13F wiring: ${pass} checks PASSED`);
