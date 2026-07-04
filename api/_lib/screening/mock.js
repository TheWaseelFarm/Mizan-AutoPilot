// api/_lib/screening/mock.js
// Mock Sharia-screening data source — returns the RAW inputs Framework B needs
// (business activity, impure-income %, debt ratio). Framework B computes the verdict.
// Swap for ./zoya.js (or halalTerminal.js) once you have a key. Same return shape.
const TABLE = {
  "NVDA": {
    "business": "Pass — hardware, chips, AI infrastructure",
    "businessStatus": "pass",
    "impurePct": 0,
    "debtRatio": 3.2,
    "reasoning": "Permissible technology business with no impure income to purify and debt well within the advisory reference. Under Framework B this is a clean buy — nothing to purify at sale.",
    "purification": "$0.00"
  },
  "GOOGL": {
    "business": "Pass with monitoring — advertising/cloud/media mix",
    "businessStatus": "watch",
    "impurePct": 1.7,
    "debtRatio": 2.9,
    "reasoning": "The core business screen is acceptable in this mock methodology, but a small portion of revenue is treated as non-compliant or doubtful. The security is therefore tagged buyable with purification at sale.",
    "purification": "$0.31 per share"
  },
  "JPM": {
    "business": "Fail — conventional interest-based banking",
    "businessStatus": "fail",
    "impurePct": 71,
    "debtRatio": 0,
    "reasoning": "The issuer is excluded at the business-activity level because conventional banking and interest income are material to the business model. The app blocks the idea before financial ratio screens matter.",
    "purification": "N/A"
  },
  "COST": {
    "business": "Pass with monitoring — retail with small non-compliant items",
    "businessStatus": "watch",
    "impurePct": 2.3,
    "debtRatio": 8.5,
    "reasoning": "The retail business is generally permissible, but this mock screen flags a minor non-compliant revenue component. The signal remains buyable with a charity purification amount when sold.",
    "purification": "$0.19 per share"
  },
  "MSFT": {
    "business": "Pass — enterprise software and cloud",
    "businessStatus": "pass",
    "impurePct": 0.8,
    "debtRatio": 7.1,
    "reasoning": "Permissible software/cloud business, but a small slice of revenue is interest/non-operating income. Under Framework B the name is buyable as Purify-at-sale, with the impure portion of any realised gain donated at sale.",
    "purification": "$0.42 per share"
  },
  "BAC": {
    "business": "Fail — conventional banking",
    "businessStatus": "fail",
    "impurePct": 68.4,
    "debtRatio": 0,
    "reasoning": "The filing may be relevant as a political/institutional signal, but the security is excluded by the Sharia business screen due to conventional banking exposure.",
    "purification": "N/A"
  },
  "META": {
    "business": "Pass with monitoring — advertising platform",
    "businessStatus": "watch",
    "impurePct": 1.9,
    "debtRatio": 1.5,
    "reasoning": "The mock screen treats the primary business as permissible but flags a small questionable revenue component. It is shown as buyable with purification due at sale.",
    "purification": "$0.27 per share"
  },
  "XOM": {
    "business": "Pass — energy production",
    "businessStatus": "pass",
    "impurePct": 0,
    "debtRatio": 52,
    "reasoning": "Permissible energy business with no impure income. Debt-to-market-cap sits above the advisory reference — but under Framework B debt is advisory only and never disqualifies, so the name stays buyable as Purify-at-sale rather than failing.",
    "purification": "$0.00 · no impure income (flagged for advisory debt only)"
  }
};

export async function screen(ticker) {
  const hit = TABLE[ticker];
  if (hit) return { ...hit, screened: true };
  // No data for this ticker. Return screened:false and DO NOT fabricate zeros as facts —
  // the values below are inert placeholders; the UI must render an "Unscreened" state
  // instead of these numbers. classifyFB still runs (engine unchanged), but the frontend
  // keys off `screened` to avoid showing a placeholder verdict.
  return {
    screened: false,
    business: "Unscreened", businessStatus: "watch",
    impurePct: 0, debtRatio: 0,
    reasoning: "No screening data available for this ticker — flagged for manual review.",
    purification: "$0.00"
  };
}
