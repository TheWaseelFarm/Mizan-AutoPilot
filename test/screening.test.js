// Self-test for the screening layer: Halal Terminal adapter (raw-ratio mapping + the
// "never map a vendor verdict" guard), the provider resolver, and the completeness gate.
// Run: npm test  (invoked by test/index.test.js) — or: node test/screening.test.js
import assert from "node:assert";

import { classifyAAOIFI } from "../api/_lib/aaoifi.js";
import { passesGate } from "../api/feed.js";
import { screen as halalTerminalScreen } from "../api/_lib/screening/halalterminal.js";
import { screen as mockScreen } from "../api/_lib/screening/mock.js";
import { screen as zoyaScreen } from "../api/_lib/screening/zoya.js";
import { activeScreener, usingLiveScreener } from "../api/_lib/screening/index.js";

// --- tiny fetch stub so the adapter never hits the network -------------------
const realFetch = globalThis.fetch;
function stubFetch(status, body) {
  globalThis.fetch = async () => ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  });
}
const restoreFetch = () => {
  globalThis.fetch = realFetch;
};

let pass = 0;
const ok = (cond, msg) => {
  assert.ok(cond, msg);
  pass++;
};

await (async () => {
  process.env.SCREENING_API_KEY = "test-key";

  // 1) Raw-ratio mapping: activity=pass, impure 1.4%, debt 19%, cash 12% -> engine says "purify".
  stubFetch(200, { business: { status: "pass", description: "Technology" }, ratios: { nonCompliantRevenuePercent: 1.4, interestBearingDebtToMarketCapPercent: 19, cashAndInterestSecuritiesToMarketCapPercent: 12 } });
  let r = await halalTerminalScreen("AVGO");
  ok(r.screened === true, "HT: screened true");
  ok(r.businessStatus === "pass", "HT: business status from activity screen");
  ok(r.impurePct === 1.4, "HT: impure % taken raw");
  ok(r.debtRatio === 19, "HT: debt ratio taken raw");
  ok(r.cashPct === 12, "HT: cash ratio taken raw");
  ok(classifyAAOIFI(r) === "purify", "HT: engine classifies raw inputs as purify");

  // 2) Impermissible ACTIVITY -> fail (business screen, not the vendor's overall verdict).
  stubFetch(200, { business: { status: "non-compliant" }, ratios: { nonCompliantRevenuePercent: 71 } });
  r = await halalTerminalScreen("JPM");
  ok(r.businessStatus === "fail", "HT: impermissible activity -> fail");
  ok(classifyAAOIFI(r) === "fail", "HT: engine fails impermissible activity");

  // 3) Debt over the 30% limit, impure 0 -> AAOIFI now FAILS (the key difference; debt no longer advisory).
  stubFetch(200, { business: { status: "pass" }, ratios: { nonCompliantRevenuePercent: 0, interestBearingDebtToMarketCapPercent: 52 } });
  r = await halalTerminalScreen("XOM");
  ok(r.debtRatio === 52, "HT: high debt ratio taken raw");
  ok(classifyAAOIFI(r) === "fail", "HT: debt > 30% -> Non-compliant under AAOIFI");

  // 4) NO_RAW_INPUTS guard: a response with ONLY a vendor verdict (no raw ratios/activity)
  //    must throw — we refuse to map the vendor's conclusion to AAOIFI.
  stubFetch(200, { compliant: true, methodology: "AAOIFI", verdict: "COMPLIANT" });
  await assert.rejects(() => halalTerminalScreen("XYZ"), /NO_RAW_INPUTS/, "HT: refuses to map a vendor verdict");
  pass++;

  // 5) 404 -> null (no data for ticker; resolver renders it unscreened).
  stubFetch(404, {});
  r = await halalTerminalScreen("NADA");
  ok(r === null, "HT: 404 -> null (unscreened)");

  restoreFetch();

  // 6) Provider resolver: live key + default -> Halal Terminal; explicit zoya; no key -> mock.
  process.env.SCREENING_API_KEY = "test-key";
  delete process.env.SCREENING_PROVIDER;
  ok(usingLiveScreener() === true, "resolver: live when key set");
  ok(activeScreener() === halalTerminalScreen, "resolver: default provider is Halal Terminal");
  process.env.SCREENING_PROVIDER = "zoya";
  ok(activeScreener() === zoyaScreen, "resolver: SCREENING_PROVIDER=zoya selects Zoya");
  delete process.env.SCREENING_API_KEY;
  delete process.env.SCREENING_PROVIDER;
  ok(activeScreener() === mockScreen, "resolver: mock when no key");

  // 7) Completeness gate: screened rows with a verdict pass; unscreened rows are excluded.
  ok(passesGate({ screened: true, label: "clean" }) === true, "gate: clean row passes");
  ok(passesGate({ screened: true, label: "fail" }) === true, "gate: fail row passes (verdict present)");
  ok(passesGate({ screened: false, label: "unscreened" }) === false, "gate: unscreened row excluded");
  ok(passesGate({ label: "" }) === false, "gate: no verdict excluded");

  console.log(`Screening layer: ${pass} checks PASSED (Halal Terminal mapping, verdict guard, resolver, gate)`);
})().catch((e) => {
  restoreFetch();
  console.error("Screening test FAILED:", e.message);
  process.exit(1);
});
