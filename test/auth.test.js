import assert from "node:assert/strict";
import crypto from "node:crypto";
import { hashPassword, checkCredentials, issueToken, verifyToken, requireAuth } from "../api/_lib/auth.js";
import { requireCron } from "../api/_lib/cron.js";
import { parseBody } from "../api/_lib/http.js";
import login from "../api/login.js";
import status from "../api/status.js";
import follows from "../api/follows.js";
import watchlist from "../api/watchlist.js";
import notifications from "../api/notifications.js";
import poll from "../api/poll-disclosures.js";
import prices from "../api/refresh-prices.js";
import rescreen from "../api/rescreen.js";
import trends from "../api/refresh-trends.js";

const secret = "test-secret-with-at-least-16-characters";
let pass = 0;
async function test(name, run) {
  const saved = { ...process.env };
  try {
    process.env.AUTH_SECRET = secret;
    process.env.CRON_SECRET = secret;
    process.env.AUTH_SALT = "test-salt";
    process.env.ADMIN_USERNAME = "admin.name";
    process.env.ADMIN_PASSWORD_HASH = hashPassword("password");
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    await run();
    pass++;
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
}
function response() {
  return {
    code: undefined, body: undefined, headers: {},
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
    setHeader(key, value) { this.headers[key] = value; },
  };
}
function signed(payload) {
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}
function request(body, ip = "login-test") {
  return { method: "POST", body, headers: {}, query: {}, socket: { remoteAddress: ip } };
}

await test("token round trip and dotted usernames", () => {
  for (const username of ["admin", "admin.name", "اسم.المستخدم"]) {
    assert.deepEqual(verifyToken(issueToken(username)), { username });
  }
});
await test("expired, tampered and malformed tokens", () => {
  assert.equal(verifyToken(issueToken("admin", -1)), null);
  const token = issueToken("admin");
  const raw = Buffer.from(token, "base64url").toString();
  assert.equal(verifyToken(Buffer.from(raw.replace("admin", "other")).toString("base64url")), null);
  for (const bad of [undefined, null, [], "", "%%%", token + "!", "YQ", signed("admin.NaN"), signed("admin.Infinity"), signed("admin."), signed(".9999999999999")]) {
    assert.equal(verifyToken(bad), null);
  }
});
await test("invalid auth configuration fails closed", () => {
  const token = issueToken("admin");
  for (const value of [undefined, "", "short", "change-me-random", "                "]) {
    if (value === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = value;
    assert.throws(() => issueToken("admin"), /Auth not configured/);
    assert.equal(verifyToken(token), null);
    assert.equal(requireAuth({ headers: { authorization: `Bearer ${token}` } }), null);
  }
});
await test("credential hashing remains compatible", () => {
  assert.equal(hashPassword("password"), crypto.createHash("sha256").update("passwordtest-salt").digest("hex"));
  assert.equal(checkCredentials("admin.name", "password"), true);
  assert.equal(checkCredentials("wrong", "password"), false);
  assert.equal(checkCredentials("admin.name", "wrong"), false);
  assert.equal(checkCredentials("admin.name", ""), false);
  process.env.ADMIN_PASSWORD_HASH += "invalid";
  assert.equal(checkCredentials("admin.name", "password"), false);
});
await test("auth header contracts", () => {
  const token = issueToken("admin");
  assert.deepEqual(requireAuth({ headers: { authorization: `Bearer ${token}` } }), { username: "admin" });
  assert.deepEqual(requireAuth({ headers: { "x-mizan-token": token } }), { username: "admin" });
  assert.equal(requireAuth({}), null);
  assert.equal(requireAuth({ headers: { authorization: [token] } }), null);
});
await test("cron rejects unconfigured secrets", () => {
  for (const value of [undefined, "", "   "]) {
    if (value === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = value;
    const res = response();
    assert.equal(requireCron({}, res), false);
    assert.equal(res.code, 503);
  }
});
await test("cron header and query contracts", () => {
  for (const req of [
    { query: { secret } },
    { headers: { "x-cron-secret": secret } },
    { headers: { authorization: `Bearer ${secret}` } },
  ]) {
    const res = response();
    assert.equal(requireCron(req, res), true);
    assert.equal(res.code, undefined);
  }
  for (const req of [{}, { query: { secret: "wrong" } }, { query: { secret: "x".repeat(secret.length) } }, { query: { secret: [secret] } }, { headers: { "x-cron-secret": [secret] } }, { headers: { authorization: [secret] } }]) {
    const res = response();
    assert.equal(requireCron(req, res), false);
    assert.equal(res.code, 401);
  }
});
await test("all cron handlers reject before database access", async () => {
  for (const handler of [poll, prices, rescreen, trends]) {
    delete process.env.CRON_SECRET;
    const unconfigured = response();
    await handler({ headers: {}, query: {} }, unconfigured);
    assert.equal(unconfigured.code, 503);
    assert.deepEqual(unconfigured.body, { error: "CRON_SECRET not configured" });
    process.env.CRON_SECRET = secret;
    const unauthorized = response();
    await handler({ headers: {}, query: { secret: "wrong" } }, unauthorized);
    assert.equal(unauthorized.code, 401);
  }
});
await test("body parsing accepts only objects", () => {
  assert.deepEqual(parseBody({ body: '{"id":1}' }), { id: 1 });
  assert.deepEqual(parseBody({ body: { id: 1 } }), { id: 1 });
  for (const body of [undefined, null, [], "null", "[]", "\"string\"", "1", "{"]) {
    assert.equal(parseBody({ body }), null);
  }
});
await test("malformed bodies return 400 before database access", async () => {
  const token = issueToken("admin.name");
  for (const handler of [login, follows, watchlist, notifications]) {
    for (const body of [undefined, null, [], "null", "[]", "{", "\"string\"", "1"]) {
      const req = request(body);
      req.headers.authorization = `Bearer ${token}`;
      const res = response();
      await handler(req, res);
      assert.equal(res.code, 400);
    }
  }
});
await test("watchlist validates id and boolean on", async () => {
  for (const body of [{}, { on: true }, { id: "", on: true }, { id: [], on: true }, { id: {}, on: true }, { id: NaN, on: true }, { id: 1 }, { id: 1, on: "false" }, { id: 1, on: null }]) {
    const req = request(body);
    req.headers.authorization = `Bearer ${issueToken("admin.name")}`;
    const res = response();
    await watchlist(req, res);
    assert.equal(res.code, 400);
  }
});
await test("login succeeds and catches missing auth configuration", async () => {
  const res = response();
  await login(request({ username: "admin.name", password: "password" }, "success"), res);
  assert.equal(res.code, 200);
  assert.deepEqual(verifyToken(res.body.token), { username: "admin.name" });
  delete process.env.AUTH_SECRET;
  const missing = response();
  await login(request({ username: "admin.name", password: "password" }, "missing-secret"), missing);
  assert.equal(missing.code, 500);
  assert.deepEqual(missing.body, { error: "Auth not configured" });
});
await test("login limits attempts per IP and expires the limit", async () => {
  const body = { username: "admin.name", password: "wrong" };
  for (let i = 0; i < 10; i++) {
    const res = response();
    await login(request(body, "limited"), res);
    assert.equal(res.code, 401);
  }
  const limited = response();
  await login(request(body, "limited"), limited);
  assert.equal(limited.code, 429);
  assert.ok(Number(limited.headers["Retry-After"]) > 0);
  const other = response();
  await login(request(body, "other"), other);
  assert.equal(other.code, 401);
  const originalNow = Date.now;
  try {
    const later = originalNow() + 16 * 60 * 1000;
    Date.now = () => later;
    const expired = response();
    await login(request(body, "limited"), expired);
    assert.equal(expired.code, 401);
  } finally { Date.now = originalNow; }
});
await test("forwarded client addresses have independent limits behind a proxy", async () => {
  const body = { username: "wrong", password: "wrong" };
  for (let i = 0; i < 11; i++) {
    const req = request(body, "shared-proxy");
    req.headers["x-forwarded-for"] = "client-one, proxy";
    const res = response();
    await login(req, res);
    assert.equal(res.code, i < 10 ? 401 : 429);
  }
  const req = request(body, "shared-proxy");
  req.headers["x-forwarded-for"] = "client-two, proxy";
  const res = response();
  await login(req, res);
  assert.equal(res.code, 401);
});
await test("public counts remain public and protected GETs require auth", async () => {
  delete process.env.AUTH_SECRET;
  const counts = response();
  await follows({ method: "GET", query: { counts: "1" }, headers: {} }, counts);
  assert.equal(counts.code, 200);
  assert.deepEqual(counts.body, {});
  for (const handler of [follows, watchlist, notifications]) {
    const res = response();
    await handler({ method: "GET", query: {}, headers: {} }, res);
    assert.equal(res.code, 401);
  }
});
await test("authenticated GET is not subject to body validation", async () => {
  const req = { method: "GET", query: {}, headers: { authorization: `Bearer ${issueToken("admin.name")}` } };
  const res = response();
  await follows(req, res);
  // Missing DB config is caught: authentication succeeded and GET skipped body validation.
  assert.equal(res.code, 500);
  assert.match(res.body.error, /Missing SUPABASE/);
  const inbox = response();
  await notifications(req, inbox);
  assert.equal(inbox.code, 200);
  assert.deepEqual(inbox.body, { items: [], unread: 0 });
});

await test("status reports secret validity without exposing secrets", async () => {
  for (const value of [undefined, "", "short", "change-me-random", "                ", secret]) {
    if (value === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = value;
    const res = response();
    await status({}, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.config.authSecret, value === secret);
    assert.equal(res.body.config.cronSecret, true);
    assert.ok(!JSON.stringify(res.body).includes(secret));
  }
  process.env.CRON_SECRET = "   ";
  const res = response();
  await status({}, res);
  assert.equal(res.body.config.cronSecret, false);
});
await test("successful login resets the IP failure counter", async () => {
  const ip = "reset-test";
  for (let i = 0; i < 9; i++) {
    const res = response();
    await login(request({ username: "admin.name", password: "wrong" }, ip), res);
    assert.equal(res.code, 401);
  }
  const success = response();
  await login(request({ username: "admin.name", password: "password" }, ip), success);
  assert.equal(success.code, 200);
  const next = response();
  await login(request({ username: "admin.name", password: "wrong" }, ip), next);
  assert.equal(next.code, 401);
});
// Exercise real Supabase query serialization while intercepting every network request.
// Keep this last because the application caches its Supabase client after creation.
await test("valid authenticated mutations reach Supabase with correct filters", async () => {
  process.env.SUPABASE_URL = "https://database-test.invalid";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    const parsed = new URL(url);
    assert.equal(parsed.origin, process.env.SUPABASE_URL);
    const body = options.body ? JSON.parse(options.body) : undefined;
    calls.push({ url: parsed, method: options.method, body });
    return new Response(JSON.stringify(parsed.pathname.endsWith("/watchlist") ? [{ id: 7, ...body }] : []), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  };
  try {
    const cases = [
      [follows, { portfolio: " Example Fund ", on: true }, "follows", "POST", { user_id: "admin.name", portfolio: "Example Fund" }, {}],
      [follows, { portfolio: "Example Fund", on: false }, "follows", "DELETE", undefined, { user_id: "eq.admin.name", portfolio: "eq.Example Fund" }],
      [notifications, { id: 42 }, "notifications", "PATCH", null, { user_id: "eq.admin.name", read_at: "is.null", id: "eq.42" }],
      [notifications, { all: true }, "notifications", "PATCH", null, { user_id: "eq.admin.name", read_at: "is.null" }],
      [watchlist, { id: 7, on: true }, "watchlist", "PATCH", { on: true }, { id: "eq.7" }],
      [watchlist, { id: 7, on: false }, "watchlist", "PATCH", { on: false }, { id: "eq.7" }],
    ];
    for (const [handler, body, table, method, payload, filters] of cases) {
      const req = request(JSON.stringify(body));
      req.headers.authorization = `Bearer ${issueToken("admin.name")}`;
      const res = response();
      const before = calls.length;
      await handler(req, res);
      assert.equal(res.code, 200, JSON.stringify(res.body));
      assert.equal(calls.length, before + 1);
      const call = calls.at(-1);
      assert.equal(call.url.pathname, `/rest/v1/${table}`);
      assert.equal(call.method, method);
      for (const [key, value] of Object.entries(filters)) assert.equal(call.url.searchParams.get(key), value);
      if (payload !== null) assert.deepEqual(call.body, payload);
      else assert.ok(Number.isFinite(Date.parse(call.body.read_at)));
      if (table === "notifications") {
        assert.deepEqual(res.body, { ok: true });
        if (body.all) assert.equal(call.url.searchParams.has("id"), false);
      }
      if (table === "follows") assert.deepEqual(res.body, { portfolio: "Example Fund", on: body.on });
      if (table === "watchlist") assert.deepEqual(res.body, { id: 7, on: body.on });
    }
  } finally { globalThis.fetch = originalFetch; }
});

console.log(`Auth: ${pass} checks PASSED`);
