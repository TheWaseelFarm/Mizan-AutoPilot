# public/app — web preview of the native app (generated)

This directory is a **generated static web export** of the Expo React Native app
(`mobile/`), so the native light/blue design is viewable in a browser at `/app/`
without installing anything. It is a build artifact, committed only to serve a
shareable preview URL.

Regenerate:
```bash
cd mobile
npm install
npm install --no-save react-dom react-native-web @expo/metro-runtime
# app.json: experiments.baseUrl = "/app"
EXPO_PUBLIC_API_BASE="" npx expo export --platform web --output-dir ../public/app
```

`EXPO_PUBLIC_API_BASE=""` makes it call the same-origin `/api/*`, so on this
deployment the preview uses the live feed; if the API errors it falls back to
bundled sample data (never fabricated).
