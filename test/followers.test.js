// Self-test for the follower-count aggregation + the "meaningful" gate. Run: npm test
import assert from "node:assert";

import { aggregateFollowerCounts, hasMeaningfulFollowers } from "../api/_lib/followers.js";

let pass = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  pass++;
};

const rows = [
  { portfolio: "Renaissance Technologies" },
  { portfolio: "Renaissance Technologies" },
  { portfolio: "Public Official Filing" },
  { portfolio: "  " }, // blank -> ignored
  { portfolio: "Renaissance Technologies" },
];
const counts = aggregateFollowerCounts(rows);
ok(counts["Renaissance Technologies"] === 3, "counts repeated follows");
ok(counts["Public Official Filing"] === 1, "counts single follow");
ok(!("" in counts) && Object.keys(counts).length === 2, "blank portfolios excluded");
ok(Object.keys(aggregateFollowerCounts([])).length === 0, "empty input -> {}");
ok(Object.keys(aggregateFollowerCounts(null)).length === 0, "null input -> {}");

// Gate: needs a real leaderboard, not one keen user.
ok(!hasMeaningfulFollowers({}), "empty -> not meaningful");
ok(!hasMeaningfulFollowers({ A: 1, B: 1, C: 1 }), "three 1-follows -> not meaningful (below minTop)");
ok(!hasMeaningfulFollowers({ A: 50, B: 50 }), "two big followings -> not meaningful (below minPortfolios)");
ok(hasMeaningfulFollowers({ A: 3, B: 4, C: 9 }), "three portfolios >= minTop -> meaningful");
ok(
  hasMeaningfulFollowers({ A: 5, B: 5 }, { minTop: 5, minPortfolios: 2 }),
  "thresholds are tunable",
);

console.log(`Followers: ${pass} checks PASSED`);
