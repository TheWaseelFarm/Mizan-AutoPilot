// scripts/local-server.js — run Mizān on this machine without Vercel.
// Serves public/ and routes /api/<name> to api/<name>.js with the small part of the Vercel
// request/response shape the handlers use (req.query, req.body, res.status().json()).
// Listens on 127.0.0.1 only. Env comes from .env.local, then .env (the shell wins over both).
//
//   node scripts/local-server.js            # http://127.0.0.1:3000
//   PORT=8790 node scripts/local-server.js
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const API = path.join(ROOT, "api");

for (const f of [".env.local", ".env"]) {
  let text = "";
  try { text = fs.readFileSync(path.join(ROOT, f), "utf8"); } catch { continue; }
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || m[1] in process.env) continue;
    process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, "$2");
  }
}

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on("data", (c) => { size += c.length; if (size > 1e6) { reject(new Error("body too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function api(req, res, url) {
  let name = url.pathname.slice("/api/".length).replace(/\/+$/, "");
  const query = Object.fromEntries(url.searchParams);
  if (name === "follower-counts") { name = "follows"; query.counts = "1"; } // vercel.json rewrite
  const file = path.join(API, name + ".js");
  if (!/^[a-z0-9-]+$/.test(name) || !fs.existsSync(file)) {
    res.writeHead(404, { "content-type": "application/json" });
    return res.end(JSON.stringify({ error: "Not found" }));
  }
  req.query = query;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const raw = await readBody(req);
    const json = /json/.test(req.headers["content-type"] || "");
    try { req.body = raw && json ? JSON.parse(raw) : raw || undefined; } catch { req.body = raw; }
  }
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { if (!res.getHeader("content-type")) res.setHeader("content-type", "application/json; charset=utf-8"); res.end(JSON.stringify(obj)); return res; };
  res.send = (v) => (v !== null && typeof v === "object" && !Buffer.isBuffer(v) ? res.json(v) : (res.end(v == null ? "" : v), res));
  const mod = await import(pathToFileURL(file).href);
  await mod.default(req, res);
}

function serveStatic(res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === "/app" || rel.startsWith("/app/")) { res.writeHead(308, { location: "/" }); return res.end(); }
  let file = path.join(PUBLIC, rel);
  if (!file.startsWith(PUBLIC + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC, "index.html");
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "no-cache" });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  try {
    if (url.pathname.startsWith("/api/")) await api(req, res, url);
    else serveStatic(res, url);
  } catch (e) {
    console.error(req.method, url.pathname, e);
    if (!res.headersSent) res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Internal error" }));
  }
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, "127.0.0.1", () => console.log(`Mizān local: http://127.0.0.1:${port}  (api/ + public/)`));
