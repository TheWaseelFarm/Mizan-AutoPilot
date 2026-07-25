// Follower-count aggregation for the "Most followed" board (spec Tab 1 / decision #8).
// The board stays HIDDEN until follower counts are meaningful, so a single early follow
// (e.g. the admin following one portfolio) never lights up an empty leaderboard. These pure
// helpers make that gate testable and identical on client and server.

/** Roll `follows` rows ([{ portfolio }]) up into { portfolio: count }. */
export function aggregateFollowerCounts(rows) {
  const counts = {};
  for (const r of rows || []) {
    const p = String(r?.portfolio || "").trim();
    if (!p) continue;
    counts[p] = (counts[p] || 0) + 1;
  }
  return counts;
}

/**
 * Is there enough of a following to rank on? True only when at least `minPortfolios`
 * portfolios clear `minTop` followers each — i.e. a real leaderboard, not one keen user.
 * Tunable so the threshold can rise as the user base grows.
 */
export function hasMeaningfulFollowers(counts, { minTop = 3, minPortfolios = 3 } = {}) {
  const qualifying = Object.values(counts || {}).filter((n) => n >= minTop);
  return qualifying.length >= minPortfolios;
}
