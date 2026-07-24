// api/_lib/notify.js
// Pure helpers for in-app notifications. NO I/O — the DB writes live in the poll loop and the
// /api/notifications endpoint; these just shape rows, so they're unit-testable.

// A short, plain notification title for a disclosure (indicator-first, minimal text).
export function notificationTitle(d = {}) {
  const side = String(d.side || "").toUpperCase() === "SELL" ? "sold" : "bought";
  const ticker = d.ticker || "a holding";
  const verdict =
    { clean: "Permissible", purify: "Purify-at-sale", fail: "Not permissible", unscreened: "Unscreened" }[d.label] || "";
  return `${d.actor || "A followed portfolio"} ${side} ${ticker}${verdict ? ` · ${verdict}` : ""}`;
}

// Build one notification row per follower for a newly-inserted disclosure. `disclosure` must
// carry the inserted `id`. Returns [] when there are no followers (nothing to write).
export function notificationRowsFor(disclosure = {}, followerUserIds = []) {
  if (disclosure.id == null || !Array.isArray(followerUserIds) || !followerUserIds.length) return [];
  const title = notificationTitle(disclosure);
  return [...new Set(followerUserIds.filter(Boolean))].map((user_id) => ({
    user_id,
    disclosure_id: disclosure.id,
    portfolio: disclosure.actor || null,
    title,
  }));
}

// Unread count from a list of notification rows.
export function unreadCount(rows = []) {
  return (rows || []).filter((r) => r && r.read_at == null).length;
}
