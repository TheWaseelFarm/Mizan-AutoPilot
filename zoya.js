// Usage: node scripts/hash.js <password>
// Prints sha256(password + AUTH_SALT). Put the result in ADMIN_PASSWORD_HASH.
import crypto from "node:crypto";
const pw = process.argv[2];
if (!pw) { console.error("Usage: node scripts/hash.js <password>"); process.exit(1); }
const salt = process.env.AUTH_SALT || "";
if (!salt) console.warn("! AUTH_SALT not set in this shell — set the SAME salt in Vercel env.");
console.log(crypto.createHash("sha256").update(pw + salt).digest("hex"));
