-- Mizān — price cache table (run in the Supabase SQL editor)
-- Populated by api/refresh-prices.js from FMP; read (cache-only) by api/prices.js.
-- Locked with RLS: only the service role (used server-side) may read/write.

create table if not exists prices (
  ticker     text primary key,
  history    jsonb,        -- [{ "d": "YYYY-MM-DD", "c": <close> }] ascending by date
  quote      numeric,      -- latest known price (real-time quote, or latest EOD close)
  updated_at timestamptz not null default now()
);
create index if not exists prices_updated_idx on prices (updated_at asc);

alter table prices enable row level security;
-- (No policies for anon/authenticated = no public access. Service role bypasses RLS.)
