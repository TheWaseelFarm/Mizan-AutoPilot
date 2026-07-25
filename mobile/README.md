# Mizān — mobile (Expo React Native)

The native app for Mizān, the **halal investing companion**. This is the v1
front-end build target (Expo RN, EAS cloud builds → App Store / Play). It reuses
the repo's existing serverless backend (`/api/*`) and the **AAOIFI** engine —
the mobile app never re-implements the verdict rule, it mirrors it.

> **Status.** Navigation, the light/blue design system, the reserved verdict color
> language, the four tabs (Home · Stocks · Following · Profile) with detail screens,
> follow state, and a live-feed data layer with an offline sample fallback.
> **Sharia verdicts and dual-anchor performance are wired to live data:** the Stock
> detail shows a sparkline plus *since disclosed* / *since public* with the freshness
> note (spec §3.4), computed client-side from `/api/prices` via `src/lib/performance.ts`
> (a mirror of the backend module), degrading honestly to "Price pending" when the
> cache is empty. Portfolio-level performance (needs portfolio reconstruction),
> risk-appetite (external provider), and per-user accounts remain "Pending" for later
> phases (spec §7 / §9).

## Run it

```bash
cd mobile
npm install
npx expo start          # then press i (iOS sim), a (Android), or scan in Expo Go
```

The app loads live data from the deployed backend by default
(`https://mizan-auto-pilot.vercel.app/api/feed`). Point it elsewhere with:

```bash
EXPO_PUBLIC_API_BASE="https://your-deployment.vercel.app" npx expo start
```

If `/api/feed` is unreachable, the app falls back to bundled sample data (clearly
labelled "sample data" in the list headers) so it's never blank.

### If dependency versions complain
The versions in `package.json` target **Expo SDK 51**. To reconcile them to your
installed Expo/React Native, run:

```bash
npx expo install --fix
```

## Native builds (EAS)

```bash
npm i -g eas-cli
eas login
eas init                 # links this app to your Expo project (writes extra.eas.projectId)
eas build --profile preview --platform ios     # or android
```

Build profiles live in `eas.json` (development / preview / production).

## What maps to the spec

| Spec | Where |
|---|---|
| Verdict color language (reserved) | `src/theme/tokens.ts` → `verdictColor` |
| AAOIFI (mirror of backend) | `src/lib/aaoifi.ts` |
| Feed contract + offline fallback | `src/lib/api.ts`, `src/lib/sample.ts` |
| Portfolio / stock roll-ups | `src/lib/derive.ts` |
| Tab 1 Home (perf-ranked portfolios) | `src/screens/HomeScreen.tsx` |
| Tab 2 Stocks (most bought/sold) | `src/screens/StocksScreen.tsx` |
| Portfolio / Stock detail | `src/screens/*DetailScreen.tsx` |
| Tab 3 Following + inbox | `src/screens/FollowingScreen.tsx` |
| Tab 4 Profile / For you | `src/screens/ProfileScreen.tsx` |
| Subtle disclaimer (every perf surface) | `src/components/Disclaimer.tsx` |

## Guardrails carried into the UI
- Nobody buys anything in Mizān. No brokerage, no copy-trading.
- The verdict is the hero; performance renders muted, with the required disclaimer.
- Unscreened names are labelled, never shown as compliant.
- No external company logos or trademarks — initials and tickers only.

## Assets
`app.json` uses Expo defaults for icon/splash. Drop brand assets into `assets/`
and reference them in `app.json` (`icon`, `splash`, `android.adaptiveIcon.foregroundImage`)
before a store build. The brand mark is a geometric blue "M" (see
`src/components/BrandHeader.tsx`).
