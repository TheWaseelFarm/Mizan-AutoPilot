// api/_lib/screening/mock.js
// Mock Sharia-screening data source — returns the RAW inputs AAOIFI Standard 21 needs
// (business activity, impure-income %, debt/cap %, cash+securities/cap %). The engine
// (api/_lib/aaoifi.js) computes the verdict; the vendor's own pass/fail is never used.
// Swap for ./halalterminal.js or ./zoya.js once you have a key. Same return shape.
const TABLE = {
  "NVDA": {
    "business": "Pass — hardware, chips, AI infrastructure",
    "businessStatus": "pass",
    "impurePct": 0, "debtRatio": 3.2, "cashPct": 6.5,
    "reasoning": "Permissible technology business; debt and cash are well within the 30% AAOIFI limits and there is no impure income — Compliant.",
    "purification": "$0.00"
  },
  "GOOGL": {
    "business": "Pass with monitoring — advertising/cloud/media mix",
    "businessStatus": "watch",
    "impurePct": 1.7, "debtRatio": 2.9, "cashPct": 11.0,
    "reasoning": "Business permissible and ratios within AAOIFI limits, but ~1.7% of revenue is impure income — Compliant, with that share of dividends to purify.",
    "purification": "$0.31 per share"
  },
  "JPM": {
    "business": "Fail — conventional interest-based banking",
    "businessStatus": "fail",
    "impurePct": 71, "debtRatio": 0, "cashPct": 0,
    "reasoning": "Excluded at the business-activity screen: conventional banking / interest income is the core model. Non-compliant regardless of ratios.",
    "purification": "N/A"
  },
  "COST": {
    "business": "Pass with monitoring — retail with small non-compliant items",
    "businessStatus": "watch",
    "impurePct": 2.3, "debtRatio": 8.5, "cashPct": 4.0,
    "reasoning": "Retail is permissible and ratios pass, but ~2.3% of revenue is impure income — Compliant, purify that share of dividends.",
    "purification": "$0.19 per share"
  },
  "MSFT": {
    "business": "Pass — enterprise software and cloud",
    "businessStatus": "pass",
    "impurePct": 0.8, "debtRatio": 7.1, "cashPct": 9.0,
    "reasoning": "Permissible software/cloud business; ratios within AAOIFI limits; a small slice of revenue is non-operating/interest income — Compliant, purify that share.",
    "purification": "$0.42 per share"
  },
  "BAC": {
    "business": "Fail — conventional banking",
    "businessStatus": "fail",
    "impurePct": 68.4, "debtRatio": 0, "cashPct": 0,
    "reasoning": "Excluded by the AAOIFI business-activity screen due to conventional banking exposure. Non-compliant.",
    "purification": "N/A"
  },
  "META": {
    "business": "Pass with monitoring — advertising platform",
    "businessStatus": "watch",
    "impurePct": 1.9, "debtRatio": 1.5, "cashPct": 14.5,
    "reasoning": "Advertising platform is permissible and ratios pass, but ~1.9% of revenue is impure income — Compliant, purify that share of dividends.",
    "purification": "$0.27 per share"
  },
  "XOM": {
    "business": "Pass — energy production",
    "businessStatus": "pass",
    "impurePct": 0, "debtRatio": 52, "cashPct": 3.0,
    "reasoning": "Permissible energy business with no impure income, BUT interest-bearing debt is ~52% of market cap — above the 30% AAOIFI limit, so the name is Non-compliant. (Under AAOIFI, debt fails a name; it is not advisory.)",
    "purification": "N/A"
  }
};

export async function screen(ticker) {
  const hit = TABLE[ticker];
  if (hit) return { ...hit, screened: true };
  // No data for this ticker. Return screened:false and DO NOT fabricate zeros as facts —
  // the values below are inert placeholders; the UI renders an "Unscreened" state instead.
  return {
    screened: false,
    business: "Unscreened", businessStatus: "watch",
    impurePct: 0, debtRatio: 0, cashPct: 0,
    reasoning: "No screening data available for this ticker — flagged for manual review.",
    purification: "$0.00"
  };
}
