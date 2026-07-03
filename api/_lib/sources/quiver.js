// api/_lib/sources/quiver.js — REAL disclosure source (congressional + 13F).
// Wire this in once you have a Quiver Quantitative key, then swap the import
// in api/poll-disclosures.js from ./sources/mock.js to ./sources/quiver.js.
export async function fetchNewDisclosures() {
  const key = process.env.QUIVER_API_KEY;
  if (!key) throw new Error("QUIVER_API_KEY not set");
  // Example shape (confirm exact endpoints/fields against Quiver's current docs):
  //   const r = await fetch("https://api.quiverquant.com/beta/live/congresstrading", {
  //     headers: { Authorization: `Bearer ${key}`, Accept: "application/json" }
  //   });
  //   const rows = await r.json();
  //   return rows.map(mapQuiverToDisclosure);
  throw new Error("Quiver adapter not implemented yet — using mock source for now.");
}
