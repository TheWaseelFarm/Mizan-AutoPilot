// api/_lib/supabase.js — server-side Supabase client (service role).
// Service role bypasses RLS; tables stay locked to the public/anon roles.
import { createClient } from "@supabase/supabase-js";

let _client;
export function supabase() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars");
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}
