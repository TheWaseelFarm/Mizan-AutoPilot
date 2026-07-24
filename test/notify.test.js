// Self-test for the in-app notification helpers. Run: npm test
import assert from "node:assert";

import { notificationTitle, notificationRowsFor, unreadCount } from "../api/_lib/notify.js";

let pass = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  pass++;
};

const disc = { id: 42, actor: "Renaissance Technologies", ticker: "NVDA", side: "BUY", label: "clean" };

ok(notificationTitle(disc) === "Renaissance Technologies bought NVDA · Permissible", "title: buy + verdict");
ok(
  notificationTitle({ ...disc, side: "SELL", label: "fail" }) ===
    "Renaissance Technologies sold NVDA · Not permissible",
  "title: sell + fail",
);

const rows = notificationRowsFor(disc, ["khalid", "musaed", "khalid"]);
ok(rows.length === 2, "one row per DISTINCT follower");
ok(rows.every((r) => r.disclosure_id === 42 && r.portfolio === "Renaissance Technologies"), "rows carry disclosure id + portfolio");
ok(notificationRowsFor(disc, []).length === 0, "no followers -> no rows");
ok(notificationRowsFor({ actor: "X" }, ["u"]).length === 0, "no disclosure id -> no rows");

ok(unreadCount([{ read_at: null }, { read_at: "2026-07-24" }, { read_at: null }]) === 2, "unreadCount counts null read_at");

console.log(`Notifications: ${pass} checks PASSED`);
