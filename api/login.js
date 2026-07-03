// POST /api/login  { username, password } -> { token, username }
import { checkCredentials, issueToken } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = typeof req.body === "string" ? safeParse(req.body) : (req.body || {});
  const { username, password } = body;
  if (!checkCredentials(username, password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  return res.status(200).json({ token: issueToken(username), username });
}
function safeParse(s){ try { return JSON.parse(s); } catch { return {}; } }
