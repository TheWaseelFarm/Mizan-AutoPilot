import crypto from "node:crypto";

// Preserve cron-job.org query URLs, while also accepting header credentials.
export function requireCron(req, res) {
  const configured = process.env.CRON_SECRET;
  if (!configured || !configured.trim()) {
    res.status(503).json({ error: "CRON_SECRET not configured" });
    return false;
  }
  const authorization = req.headers?.authorization;
  const bearer = typeof authorization === "string" && authorization.startsWith("Bearer ")
    ? authorization.slice(7) : undefined;
  const supplied = req.headers?.["x-cron-secret"] ?? bearer ?? req.query?.secret;
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
