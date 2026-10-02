// api/_lib/auth.js — simple hash-based auth (same pattern as the farm app).
// Single admin user via env: ADMIN_USERNAME + ADMIN_PASSWORD_HASH.
// Generate the hash with: node scripts/hash.js <password>
import crypto from "node:crypto";

const SALT   = () => process.env.AUTH_SALT   || "";
const SECRET = () => {
  const secret = process.env.AUTH_SECRET;
  return typeof secret === "string" && secret.trim().length >= 16 &&
    secret !== "change-me-random" ? secret : null;
};

export function isAuthConfigured() {
  return SECRET() !== null;
}

export function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password) + SALT()).digest("hex");
}

function safeEqualHex(a, b) {
  if (!/^[a-f0-9]{64}$/i.test(String(a)) || !/^[a-f0-9]{64}$/i.test(String(b))) return false;
  const ba = Buffer.from(String(a), "hex");
  const bb = Buffer.from(String(b), "hex");
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export function checkCredentials(username, password) {
  // Compare fixed-size digests so username length/content does not short-circuit auth.
  const userDigest = crypto.createHash("sha256").update(typeof username === "string" ? username : "").digest();
  const expectedUser = crypto.createHash("sha256").update(process.env.ADMIN_USERNAME || "").digest();
  const userMatches = crypto.timingSafeEqual(userDigest, expectedUser);
  const okUser = typeof username === "string" && !!username && userMatches;
  const matches = safeEqualHex(hashPassword(password), process.env.ADMIN_PASSWORD_HASH);
  const okPass = typeof password === "string" && !!password && matches;
  return okUser && okPass;
}

export function issueToken(username, ttlHours = 168) {
  const secret = SECRET();
  if (!secret) throw new Error("Auth not configured");
  const exp = Date.now() + ttlHours * 3600 * 1000;
  if (typeof username !== "string" || !username || !Number.isFinite(exp)) {
    throw new Error("Invalid token payload");
  }
  const payload = `${username}.${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyToken(token) {
  try {
    const secret = SECRET();
    if (!secret || typeof token !== "string" || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
    const raw = Buffer.from(token, "base64url").toString("utf8");
    if (Buffer.from(raw).toString("base64url") !== token) return null;
    const sigIndex = raw.lastIndexOf(".");
    const expIndex = raw.lastIndexOf(".", sigIndex - 1);
    if (expIndex <= 0 || sigIndex <= expIndex) return null;
    const username = raw.slice(0, expIndex);
    const exp = raw.slice(expIndex + 1, sigIndex);
    const sig = raw.slice(sigIndex + 1);
    if (!exp.trim() || !Number.isFinite(Number(exp)) || Date.now() >= Number(exp)) return null;
    const expected = crypto.createHmac("sha256", secret).update(raw.slice(0, sigIndex)).digest("hex");
    if (!safeEqualHex(sig, expected)) return null;
    return { username };
  } catch { return null; }
}

export function requireAuth(req) {
  const h = req.headers?.authorization || "";
  const token = typeof h === "string" && h.startsWith("Bearer ") ? h.slice(7) : (req.headers?.["x-mizan-token"] || "");
  return verifyToken(token);
}
