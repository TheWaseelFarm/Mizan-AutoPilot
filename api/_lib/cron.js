import crypto from "node:crypto";

// Header credentials only (Authorization: Bearer, or x-cron-secret). A secret in the URL is
// written to access logs, browser history and Referer headers, so ?secret= is not accepted.
export function requireCron(req, res) {
  const configured = process.env.CRON_SECRET;
  if (!configured || !configured.trim()) {
    res.status(503).json({ error: "CRON_SECRET not configured" });
    return false;
  }
  const authorization = req.headers?.authorization;
  const bearer = typeof authorization === "string" && authorization.startsWith("Bearer ")
    ? authorization.slice(7) : undefined;
  const supplied = req.headers?.["x-cron-secret"] ?? bearer;
  if (typeof supplied !== "string") {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  const actual = Buffer.from(supplied);
  const expected = Buffer.from(configured);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}
