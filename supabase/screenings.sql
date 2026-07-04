-- Mizān — screening cache table (run in the Supabase SQL editor)
-- Caches per-ticker screening payloads so poll-disclosures / rescreen don't re-hit the
-- provider (Zoya) more than needed. A ticker is refreshed only when older than 30 days.
-- RLS-locked: only the service role (used server-side) may read/write.

create table if not exists screenings (
  ticker     text primary key,
  payload    jsonb,        -- { screened, business, businessStatus, impurePct, debtRatio, reasoning, purification }
  fetched_at timestamptz not null default now()
);
create index if not exists screenings_fetched_idx on screenings (fetched_at asc);

alter table screenings enable row level security;
-- (No policies for anon/authenticated = no public access. Service role bypasses RLS.)
