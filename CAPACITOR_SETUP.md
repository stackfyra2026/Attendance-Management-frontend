# Capacitor Mobile Build — Setup & Reference

This document explains how to build and ship the **AttendFlow / StaffFlow** React app as a native
Android/iOS app using [Capacitor](https://capacitorjs.com). The web application is **unchanged**;
Capacitor wraps the existing build output in a native shell.

## Prerequisites

- Node.js 18+ and npm
- **Android**: Android Studio + JDK 17, Android SDK (API 34+)
- **iOS**: macOS only — Xcode 15+

## 1. Install dependencies

```bash
npm install
npm run dev          # develop the web app as before (port 3000)
```

## 2. First-time native project generated

The `android/` and `ios/` folders were created with:

```bash
npx cap add android
npx cap add ios
```

Do not run these again unless you delete the folders. They are git-ignored (see `.gitignore`).

## 3. Daily workflow

```bash
npm run cap:android        # build web → sync → open Android Studio
npm run cap:ios            # build web → sync → open Xcode
npm run cap:run:android    # build + sync + deploy to connected device/emulator
npm run cap:doctor         # sanity-check the native projects
```

`cap:sync` (build + `cap sync`) copies `dist/` into `android/app/src/main/assets/public` and
`ios/App/App/public` and regenerates the native plugin registry.

## 4. Configuration (`capacitor.config.ts`)

| Setting | Value | Purpose |
| --- | --- | --- |
| `appId` | `com.webetechies.staffflow` | Package / bundle identifier |
| `appName` | `StaffFlow` | Display name |
| `webDir` | `dist` | Vite build output copied into the shell |
| `server.androidScheme` | `https` | Android loads the app from `https://localhost` (native APIs stay available) |
| `SplashScreen` | `#00a884`, 2s, `CENTER_CROP` | Brand splash behaviour |
| `StatusBar` | `DARK`, `#00a884`, overlay | Header color behind the status bar |
| `Keyboard` | `resize: body`, `DARK` | Keyboard resizes the document body |

## 5. Environment variables

Copy `.env.example` to `.env` and fill in values. Frontend env vars are baked in at build time.
- `VITE_API_BASE_URL` — real API root (the app calls `/notifications/device-token` etc.)
- `VITE_FIREBASE_*` — web FCM. On native, push goes through the `@capacitor/push-notifications`
  plugin and FCM/APNs, not the web SW. FCM registration still needs each platform's credentials
  (see below) so the backend can send the same payloads to native tokens.

## 6. Push notifications (native)

### Android (FCM)
1. Create a Firebase project and download **`google-services.json`**.
2. Place it at `android/app/google-services.json` (do **not** commit it).
3. The Capacitor template already registers the `com.google.gms.google-services` gradle plugin.
4. Android 13+ asks for the `POST_NOTIFICATIONS` permission at runtime — the app requests it on
   first launch via `registerForNativePush` (already wired in `src/services/native/notifications.ts`).

### iOS (APNs)
1. In Xcode → Signing & Capabilities, add the **Push Notifications** capability,
   or create a `app.aps-environment=development` entitlement.
2. Upload an APNs auth key (or certs) to your push provider / FCM.
3. iOS prompts for notification permission at runtime through the same plugin.

## 7. Camera, gallery, and location

- iOS usage strings are already in `ios/App/App/Info.plist` (`NSCameraUsageDescription`,
  `NSPhotoLibraryUsageDescription`, `NSLocationWhenInUseUsageDescription`).
- Android permissions are in `android/app/src/main/AndroidManifest.xml`
  (`CAMERA`, `ACCESS_FINE/COARSE_LOCATION`, `POST_NOTIFICATIONS`, `INTERNET`).
- On native, photos use the system camera/gallery; on web, the existing file inputs still apply.

## 8. App icons & splash assets

The default Capacitor launcher icons are placeholders. Generate branded assets once with:

```bash
npx @capacitor/assets generate --iconBackgroundColor '#00a884' --splashBackgroundColor '#00a884'
```

Provide a 1024×1024 icon (`assets/icon-only.png`) and 2732×2732 splash (`assets/splash.png`),
then re-run `npx cap sync`.

## 9. Deep linking (force-update store links, notifications → screens)

- **Custom scheme** `staffflow://` is registered on both platforms
  (Android manifest intent filter + iOS `CFBundleURLTypes`). Use
  `staffflow://open/<path>?<query>` to route inside the app.
- **Android App Links** (`https://app.staffflow.com`) are declared with `android:autoVerify`;
  publish `assetlinks.json` on the domain to enable them.
- **iOS Universal Links** require an **Associated Domains** entitlement +
  `apple-app-site-association` hosted on the domain. Add these when you have a production domain.

Incoming links are handled in `src/services/native/deep-link.ts` and routed by
`src/components/native/NativeChrome.tsx` via React Router (same BrowserRouter as web).

## 10. Force update

The app checks `GET {baseUrl}/app/version` on native builds. Expected response:

```json
{
  "android": { "minimumVersion": "1.0.0", "latestVersion": "1.1.0", "forceUpdate": true, "storeUrl": "" },
  "ios":     { "minimumVersion": "1.0.0", "latestVersion": "1.1.0", "forceUpdate": true, "storeUrl": "" }
}
```

- `minimumVersion` > installed version and `forceUpdate: true` → full-screen update screen.
- Missing endpoint / non-mobile platform → feature silently skipped.

## 11. Single device login per day

Only **one account may log in on the same device per calendar day**; the slot frees
automatically at midnight in the configured timezone. Same-user re-login the same day is
allowed; logout does **not** free the slot.

- **Backend flag** (NestJS): `SINGLE_DEVICE_LOGIN_ENABLED=true` in the backend `.env`
  (default `false` = disabled). Day boundary: `DEVICE_SESSION_TIMEZONE` (default `Asia/Kolkata`).
  Backend model: `DeviceSession { deviceId, userId, dayKey }` with a `UNIQUE(deviceId, dayKey)`
  index. Blocked attempt → `403` with code `DEVICE_SESSION_BLOCKED` + audit `login_blocked`.
- **Frontend both platforms**: every request carries `X-Device-Id`, set by the axios interceptor
  in `src/services/http/request.ts` from `src/services/device.service.ts` — a UUID generated once
  and persisted via the storage abstraction (`localStorage` on web,
  `@capacitor/preferences` on native). The id is **never cleared on logout** (that is the
  enforcement point).
- Same code path covers web + Capacitor; no native plugin needed.
- This is a business-rule gate, not a security boundary: clearing the browser profile (incognito)
  or reinstalling the app produces a new id.

## 12. Release notes & gotchas

- **Always rebuild `dist/` before installing on a device** (`npm run cap:sync`).
- The PWA service worker is skipped on native (`src/main.tsx`); Capacitor handles offline shell.
- Tokens now persist via `@capacitor/preferences` on native and `localStorage` on web
  (`src/services/storage/`). Logging out clears both.
- API requests must go to an HTTPS endpoint in production (Android blocks cleartext by default).
- `POST_NOTIFICATIONS` on Android and notification auth on iOS are optional — the app keeps
  working if denied; only in-app banners/lists render without them.