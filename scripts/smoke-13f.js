// Live, READ-ONLY smoke run of the SEC EDGAR 13F source (no database, no writes).
//   SEC_USER_AGENT="Mizan <contact email>" node scripts/smoke-13f.js "Berkshire Hathaway" "Pershing Square"
// With no fund names it runs the first two curated funds. Prints each fund's mapped top holdings.
import { FUNDS, fundLatest, fundSnapshot } from "../api/_lib/sources/edgar13f.js";

const names = process.argv.slice(2);
const funds = names.length ? FUNDS.filter((f) => names.some((n) => f.actor.toLowerCase().includes(n.toLowerCase()))) : FUNDS.slice(0, 2);
if (!funds.length) {
  console.error("No matching funds. Known:", FUNDS.map((f) => f.actor).join(", "));
  process.exit(1);
}

const usd = (n) => "$" + (n / 1e6).toLocaleString("en-US", { maximumFractionDigits: 1 }) + "M";
const figiCache = new Map();
for (const fund of funds) {
  const t0 = Date.now();
  const meta = await fundLatest(fund);
  if (!meta || meta.stale || !meta.snapshot?.length) {
    console.log(`\n${fund.actor}: no usable 13F (${meta ? (meta.stale ? "stale" : "no snapshot") : "none"})`);
    continue;
  }
  const { rows, stats } = await fundSnapshot(fund, meta, { figiCache });
  const total = rows.reduce((a, r) => a + r.positionValue, 0) || 1;
  console.log(`\n${fund.actor} (CIK ${fund.cik}) — period ${stats.period}, filed ${stats.filed} [${stats.filings.join(", ")}]`);
  console.log(`  ${stats.positions} positions parsed (${stats.rows} rows; ${stats.options} option rows, ${stats.principal} principal rows skipped); ` +
    `${stats.unmappedCusips} unmapped CUSIPs skipped; kept top ${rows.length} — ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  for (const r of rows.slice(0, 10)) {
    console.log(`  ${r.ticker.padEnd(6)} ${String(r.company).slice(0, 30).padEnd(30)} ${usd(r.positionValue).padStart(12)}  ${((r.positionValue / total) * 100).toFixed(1).padStart(5)}% of top-${rows.length}  ${r.sharesLabel}`);
  }
  if (rows.length > 10) console.log(`  … ${rows.length - 10} more`);
  console.log(`  sample row: ${JSON.stringify({ ...rows[0], company: undefined })}`);
}
