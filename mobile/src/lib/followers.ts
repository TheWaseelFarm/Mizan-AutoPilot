// Client mirror of api/_lib/followers.js — the "Most followed" gate must decide identically
// on both sides. The board stays hidden until the counts describe a real leaderboard, not one
// keen user (decision #8).

export type FollowerCounts = Record<string, number>;

/**
 * Enough of a following to rank on? True only when at least `minPortfolios` portfolios clear
 * `minTop` followers each. Keeps a single early follow from lighting up an empty board.
 */
export function hasMeaningfulFollowers(
  counts: FollowerCounts,
  { minTop = 3, minPortfolios = 3 }: { minTop?: number; minPortfolios?: number } = {},
): boolean {
  const qualifying = Object.values(counts || {}).filter((n) => n >= minTop);
  return qualifying.length >= minPortfolios;
}
