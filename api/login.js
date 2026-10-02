// POST /api/login { username, password } -> { token, username }
import { checkCredentials, issueToken } from "./_lib/auth.js";
import { parseBody } from "./_lib/http.js";

// Best effort per warm serverless instance; deployment-wide limits need shared storage.
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const MAX_IPS = 1000;
let requests = 0;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = parseBody(req);
  if (!body || typeof body.username !== "string" || typeof body.password !== "string") {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const forwarded = req.headers?.["x-forwarded-for"];
  // Trust the first forwarded address only when the hosting proxy (Vercel) overwrites
  // this header. On other hosts sanitize it at the proxy to prevent spoofed limits.
  const ip = (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : "") ||
    req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  // Bound memory to MAX_IPS and amortize the O(n) cleanup over 100 requests.
  if (++requests % 100 === 0) {
    for (const [key, value] of attempts) {
      if (value.until <= now) attempts.delete(key);
    }
  }
  let attempt = attempts.get(ip);
  if (!attempt || attempt.until <= now) {
    if (!attempt && attempts.size >= MAX_IPS) attempts.delete(attempts.keys().next().value);
    attempt = { count: 0, until: now + WINDOW_MS };
    attempts.set(ip, attempt);
  }
  if (attempt.count >= MAX_ATTEMPTS) {
    res.setHeader("Retry-After", String(Math.ceil((attempt.until - now) / 1000)));
    return res.status(429).json({ error: "Too many login attempts" });
  }
  attempt.count++;
  const { username, password } = body;
  if (!checkCredentials(username, password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  try {
    const token = issueToken(username);
    // Single-admin convenience: a successful login resets this IP's failures.
    attempts.delete(ip);
    return res.status(200).json({ token, username });
  } catch {
    return res.status(500).json({ error: "Auth not configured" });
  }
}
