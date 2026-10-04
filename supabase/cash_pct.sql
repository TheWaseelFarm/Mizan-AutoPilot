-- Mizān — add the AAOIFI cash ratio column (run once in the Supabase SQL editor).
-- Production's `disclosures` table predates this column, so the AAOIFI cash + interest-bearing
-- securities screen (limit 30% of market cap) could never be applied. After running this, the
-- next /api/rescreen run (daily 07:00 UTC, or the cron workflow's "Run workflow") copies the
-- cached ratios onto existing rows and the feed's verdicts reflect the cash screen.
alter table disclosures add column if not exists cash_pct numeric;
comment on column disclosures.cash_pct is 'cash + interest-bearing securities / market cap (%) — AAOIFI: over 30% fails; null = not reported';
