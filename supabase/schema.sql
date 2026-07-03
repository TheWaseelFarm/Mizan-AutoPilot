-- Mizān — Supabase schema (run in the Supabase SQL editor)
-- Tables are locked with RLS. The serverless functions use the SERVICE ROLE key,
-- which bypasses RLS; the public/anon roles get no access by default.

create table if not exists disclosures (
  id               bigint generated always as identity primary key,
  created_at       timestamptz not null default now(),
  dedupe_key       text unique not null,
  actor            text not null,
  kind             text,
  initials         text,
  source           text,
  side             text check (side in ('BUY','SELL')),
  ticker           text not null,
  company          text,
  sector           text,
  amount           text,
  amount_mid       numeric,
  shares           integer,
  shares_label     text,
  transaction_date text,
  filing_date      text,
  purchase_price   numeric,
  fallback_price   numeric,
  business         text,
  business_status  text check (business_status in ('pass','watch','fail')),
  impure_pct       numeric default 0,
  debt_ratio       numeric default 0,
  reasoning        text,
  purification     text,
  label            text,            -- cached Framework B verdict (engine remains source of truth)
  alert            text,
  confidence       text
);
create index if not exists disclosures_filing_idx on disclosures (filing_date desc);
create index if not exists disclosures_ticker_idx on disclosures (ticker);

create table if not exists watchlist (
  id        bigint generated always as identity primary key,
  name      text not null,
  sub       text,
  initials  text,
  type      text check (type in ('person','fund')),
  "on"      boolean not null default true
);

create table if not exists alerts_sent (
  id            bigint generated always as identity primary key,
  disclosure_id bigint references disclosures(id) on delete cascade,
  channel       text,               -- web-push | fcm | email | telegram
  sent_at       timestamptz not null default now(),
  unique (disclosure_id, channel)
);

-- Lock everything down; only the service role (used server-side) may read/write.
alter table disclosures enable row level security;
alter table watchlist   enable row level security;
alter table alerts_sent enable row level security;
-- (No policies for anon/authenticated = no public access. Service role bypasses RLS.)

-- Seed: disclosures (generated from the corrected Mizān prototype)
insert into disclosures (dedupe_key,actor,kind,initials,source,side,ticker,company,sector,amount,amount_mid,shares,shares_label,transaction_date,filing_date,purchase_price,fallback_price,business,business_status,impure_pct,debt_ratio,reasoning,purification,label,alert,confidence) values
('13F-HR|Renaissance Technologies|NVDA|Jun 17, 2026|BUY','Renaissance Technologies','13F Fund','RT','13F-HR','BUY','NVDA','NVIDIA Corp.','Semiconductors','$15,001–$50,000',32500,235,'Estimated from midpoint','Jun 17, 2026','Jun 25, 2026',138.1,151.42,'Pass — hardware, chips, AI infrastructure','pass',0,3.2,'Permissible technology business with no impure income to purify and debt well within the advisory reference. Under Framework B this is a clean buy — nothing to purify at sale.','$0.00','clean','New Clean BUY in AI infrastructure','High'),
('13F-HR|Berkshire Crest Fund|GOOGL|May 30, 2026|BUY','Berkshire Crest Fund','13F Fund','BC','13F-HR','BUY','GOOGL','Alphabet Inc. Class A','Communication services','128,450 shares',22300000,128450,'Reported in 13F','May 30, 2026','Jun 24, 2026',173.6,184.88,'Pass with monitoring — advertising/cloud/media mix','watch',1.7,2.9,'The core business screen is acceptable in this mock methodology, but a small portion of revenue is treated as non-compliant or doubtful. The security is therefore tagged buyable with purification at sale.','$0.31 per share','purify','Purify-at-sale BUY by fund','Medium'),
('13F-HR|Global Value Fund|JPM|Jun 11, 2026|SELL','Global Value Fund','13F Fund','GV','13F-HR','SELL','JPM','JPMorgan Chase & Co.','Conventional banking','$50,001–$100,000',75000,347,'Estimated from midpoint','Jun 11, 2026','Jun 23, 2026',216.25,209.14,'Fail — conventional interest-based banking','fail',71,0,'The issuer is excluded at the business-activity level because conventional banking and interest income are material to the business model. The app blocks the idea before financial ratio screens matter.','N/A','fail','Excluded security appeared in filing','High'),
('13F-HR|Top Growth Fund|COST|Jun 09, 2026|BUY','Top Growth Fund','13F Fund','TG','13F-HR','BUY','COST','Costco Wholesale Corp.','Consumer staples','$1,001–$15,000',8000,9,'Estimated from midpoint','Jun 09, 2026','Jun 22, 2026',903.5,928.76,'Pass with monitoring — retail with small non-compliant items','watch',2.3,8.5,'The retail business is generally permissible, but this mock screen flags a minor non-compliant revenue component. The signal remains buyable with a charity purification amount when sold.','$0.19 per share','purify','Small BUY requiring purification','Medium'),
('13F-HR/A|Northstar Quant Partners|MSFT|May 29, 2026|SELL','Northstar Quant Partners','13F Fund','NQ','13F-HR/A','SELL','MSFT','Microsoft Corp.','Software/cloud','43,200 shares',19200000,43200,'Reported in 13F','May 29, 2026','Jun 21, 2026',444.2,467.15,'Pass — enterprise software and cloud','pass',0.8,7.1,'Permissible software/cloud business, but a small slice of revenue is interest/non-operating income. Under Framework B the name is buyable as Purify-at-sale, with the impure portion of any realised gain donated at sale.','$0.42 per share','purify','Purify-at-sale SELL by institutional fund','High'),
('Senate PTR|Public Official Filing|BAC|Jun 06, 2026|BUY','Public Official Filing','Congress','PO','Senate PTR','BUY','BAC','Bank of America Corp.','Conventional banking','$1,001–$15,000',8000,29,'Estimated from midpoint','Jun 06, 2026','Jun 19, 2026',274.6,268.33,'Fail — conventional banking','fail',68.4,0,'The filing may be relevant as a political/institutional signal, but the security is excluded by the Sharia business screen due to conventional banking exposure.','N/A','fail','Fail BUY detected','High'),
('13F-HR|Crescent Lake Capital|META|Jun 03, 2026|BUY','Crescent Lake Capital','13F Fund','CL','13F-HR','BUY','META','Meta Platforms Inc.','Digital advertising','18,900 shares',11800000,18900,'Reported in 13F','Jun 03, 2026','Jun 18, 2026',625.7,642.8,'Pass with monitoring — advertising platform','watch',1.9,1.5,'The mock screen treats the primary business as permissible but flags a small questionable revenue component. It is shown as buyable with purification due at sale.','$0.27 per share','purify','Fund added Purify-at-sale name','Medium'),
('House PTR|Public Official Filing|XOM|Jun 02, 2026|SELL','Public Official Filing','Congress','PO','House PTR','SELL','XOM','Exxon Mobil Corp.','Energy','$15,001–$50,000',32500,282,'Estimated from midpoint','Jun 02, 2026','Jun 17, 2026',115.1,111.92,'Pass — energy production','pass',0,52,'Permissible energy business with no impure income. Debt-to-market-cap sits above the advisory reference — but under Framework B debt is advisory only and never disqualifies, so the name stays buyable as Purify-at-sale rather than failing.','$0.00 · no impure income (flagged for advisory debt only)','purify','Purify-at-sale — advisory debt, not a Fail','High')
on conflict (dedupe_key) do nothing;

-- Seed: watchlist sources
insert into watchlist (name,sub,initials,type,"on") values
('Renaissance Technologies','Institutional · Technology disclosures','RT','fund',true),
('Public Official Filing','Officials · Financial disclosures','PO','person',true),
('Berkshire Crest Fund','13F fund · Large-cap quality','BC','fund',true),
('Northstar Quant Partners','13F fund · Quant portfolio','NQ','fund',false),
('Crescent Lake Capital','13F fund · Growth managers','CL','fund',true);
