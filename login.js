// api/_lib/auth.js — simple hash-based auth (same pattern as the farm app).
// Single admin user via env: ADMIN_USERNAME + ADMIN_PASSWORD_HASH.
// Generate the hash with: node scripts/hash.js <password>
import crypto from "node:crypto";

const SALT   = () => process.env.AUTH_SALT   || "";
const SECRET = () => process.env.AUTH_SECRET || "change-me-in-env";

export function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password) + SALT()).digest("hex");
}

function safeEqualHex(a, b) {
  const ba = Buffer.from(String(a), "hex");
  const bb = Buffer.from(String(b), "hex");
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export function checkCredentials(username, password) {
  const okUser = !!username && username === process.env.ADMIN_USERNAME;
  const okPass = !!password && !!process.env.ADMIN_PASSWORD_HASH &&
                 safeEqualHex(hashPassword(password), process.env.ADMIN_PASSWORD_HASH);
  return okUser && okPass;
}

export function issueToken(username, ttlHours = 168) {
  const exp = Date.now() + ttlHours * 3600 * 1000;
  const payload = `${username}.${exp}`;
  const sig = crypto.createHmac("sha256", SECRET()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyToken(token) {
  try {
    const raw = Buffer.from(String(token), "base64url").toString("utf8");
    const [username, exp, sig] = raw.split(".");
    const expected = crypto.createHmac("sha256", SECRET()).update(`${username}.${exp}`).digest("hex");
    if (!safeEqualHex(sig, expected)) return null;
    if (Date.now() > Number(exp)) return null;
    return { username };
  } catch { return null; }
}

export function requireAuth(req) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : (req.headers["x-mizan-token"] || "");
  return verifyToken(token);
}
