# Web export — the app IS the site root

`public/` is a **generated static web export** of the Expo React Native app
(`mobile/`). It is served at the site root (`https://mizan-auto-pilot.vercel.app/`),
so the native light/blue app is the main page — no `/app/` prefix anymore.
`vercel.json` redirects the old `/app` links to `/`.

Regenerate:
```bash
cd mobile
npm install
npm install --no-save react-dom react-native-web @expo/metro-runtime
# app.json has NO experiments.baseUrl -> assets resolve from the site root (/_expo/…)
EXPO_PUBLIC_API_BASE="" npx expo export --platform web --output-dir ../public
```

`EXPO_PUBLIC_API_BASE=""` makes it call the same-origin `/api/*`, so the page
uses the live feed; if the API errors it falls back to bundled sample data
(never fabricated).
