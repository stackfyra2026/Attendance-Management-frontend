# AttendFlow — Tech Context

## Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.3.0 | UI framework |
| TypeScript | 6.0.2 | Type safety |
| Vite | 8.3.0 | Build tool + dev server |
| Tailwind CSS | 4.3.3 | Styling (CSS-first config) |
| @tailwindcss/vite | 4.3.3 | Vite plugin for Tailwind |
| React Router | 7.18.3 | Client-side routing |
| Redux Toolkit | 2.12.0 | State management |
| React Redux | 9.3.0 | React bindings for Redux |
| Axios | 1.20.0 | HTTP client (for future API) |
| React Hook Form | 7.87.0 | Form management |
| Zod | 3.25.76 | Schema validation |
| @hookform/resolvers | 5.9.1 | RHF + Zod integration |
| Lucide React | 1.44.0 | Icons |
| Recharts | 3.10.1 | Charts (admin dashboard) |
| date-fns | 4.4.0 | Date utilities |
| firebase | 12.19.0 | Firebase Cloud Messaging (web push) — FE modular SDK (`firebase/app`, `firebase/messaging`) + SW `src/firebase-messaging-sw.ts` (compat `importScripts` 10.14.1, merged with the PWA Workbox SW) |
| vite-plugin-pwa | 1.3.0 | PWA — injectManifest SW + web manifest (built from `src/firebase-messaging-sw.ts`) |
| @vite-pwa/assets-generator | 1.0.4 | One-off PWA icon generation (PNG/ICO from `public/logo.svg`) |
| react-onesignal | 3.5.6 | OneSignal (legacy/latent — not used by FCM path; kept in deps) |
| @capacitor/core | 8.x | Capacitor core runtime (mobile wrapper: Android + iOS) |
| @capacitor/cli | 8.x (dev) | Capacitor CLI — `cap add/sync/open`, `capacitor.config.ts` |
| @capacitor/android | 8.x | Android platform |
| @capacitor/ios | 8.x | iOS platform |
| @capacitor/camera | 8.2.4 | Native camera/gallery capture (new abstraction `src/services/native/camera.ts`) |
| @capacitor/geolocation | 8.2.2 | Native GPS/permission (new abstraction `src/services/native/location.ts`) |
| @capacitor/push-notifications | 8.1.2 | Native push (FCM Android / APNs iOS; web keeps FCM SW) |
| @capacitor/preferences | 8.0.1 | Native KV storage for session tokens (web → localStorage fallback) |
| @capacitor/network | 8.0.1 | Connectivity detection (OfflineBanner) |
| @capacitor/app | 8.1.1 | App lifecycle + Android back button + app version |
| @capacitor/keyboard | 8.0.5 | Keyboard resize behavior (resize: body) |
| @capacitor/status-bar | 8.0.3 | Status bar style/color |
| @capacitor/splash-screen | 8.0.2 | Splash screen (#00a884 branding) |
| React Router native bridges | — | `src/services/native/` modules: `platform.ts`, `version.ts`, `camera.ts`, `location.ts`, `notifications.ts`, `force-update.ts`, `back-button.ts`, `network.ts`, `deep-link.ts` (+ barrel `index.ts`) |
| `src/services/device.service.ts` | — | Single-device-login id: `getDeviceId()` — UUID stored once via storage abstraction (`attendflow.device-id`) on web + native, single-flight, never cleared on logout; `DEVICE_ID_HEADER = "X-Device-Id"` sent by `request.ts` interceptor on every request; pairs with backend `DeviceSession` + `DEVICE_SESSION_BLOCKED` gate (feature flag) |

**Backend additions** (`Attendance Management-backend`): `firebase-admin` (v13) for FCM server SDK — module-scoped namespaces `firebase-admin/app` + `firebase-admin/messaging` (the `import * as admin` blob lacks `app`/`credential` types in v13). `@nestjs/schedule` — cron infra for the shift-over attendance reminder (`AttendanceReminderService`, `@Cron('*/15 * * * *', { timeZone: 'Asia/Kolkata' })`, registered via `ScheduleModule.forRoot()` in `app.module.ts`). `resend` (v6.28.1) — transactional email for the password-reset OTP (`MailModule`/`MailService`, @Global; dev fallback logs OTP to console when apiKey unset/send fails — never in production).

## Development Setup
- Node.js 22.16.0 / npm 10.9.2
- `npm run dev` → Vite dev server on port 3000
- `npm run build` → TypeScript check + Vite build
- `npm run preview` → Preview production build

## Path Aliases
- `@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.json`)
- TypeScript uses `"ignoreDeprecations": "6.0"` for `baseUrl`/`paths`

## Environment Variables
```
VITE_GOOGLE_MAPS_API_KEY=            # Google Maps API key (optional) — never commit (§38)
VITE_APP_NAME=AttendFlow             # App name branding (§2)
VITE_API_BASE_URL=                   # e.g. http://localhost:3001/api/v1
VITE_ONESIGNAL_APP_ID=               # OneSignal (latent)
VITE_FIREBASE_API_KEY=               # FCM web push — SW merged into `src/firebase-messaging-sw.ts`
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=             # required for getToken (web push)
```
FE push is disabled until the `VITE_FIREBASE_*` keys are set (see `src/config/firebase.ts` `isFirebaseConfigured()`).

**Backend env** (`.env` only — no `.env.example` shipped): `PUSH_ENABLED=false`, `FIREBASE_SERVICE_ACCOUNT=` (JSON string or path; falls back to `applicationDefault()`), `FIREBASE_PROJECT_ID=`. Push only initializes when enabled + creds present — otherwise `NotificationsService.notify()` degrades to in-app notifications. Password-reset OTP: `RESEND_API_KEY=` (present in `.env`; console-logged OTP fallback used when unset), `RESEND_FROM_EMAIL`, `RESET_OTP_LENGTH`, `RESET_OTP_TTL_MINUTES`, `RESET_OTP_MAX_ATTEMPTS`, `RESET_OTP_RESEND_COOLDOWN`. Env keys live in the repo `.env` files (gitignored).

## Build Notes
- TypeScript strict mode enabled
- `noUnusedLocals` and `noUnusedParameters` enforced
- `noUncheckedIndexedAccess` enabled (array/object access may be undefined)
- Build command: `tsc && vite build`
- Library constraint: do not introduce unnecessary libraries (§1); use only the listed stack

## Service Layer Structure
- Flat: `src/services/*.service.ts` (per §45 + decision D8; NOT `src/services/location/`)
- `location.service.ts` wraps `navigator.geolocation`, returns `{ latitude, longitude, accuracy }` (§15)
- `src/mocks/data/` holds all mock data; services switch between mock and real via `VITE_USE_MOCK_API` (§46, §47)
- Types in `src/types/`: User, Employee, Department, Designation, Team, OfficeLocation, Shift, Attendance, AttendanceLocation, Leave, LeaveType, Holiday, Notification, Announcement, Role, Permission, AuditLog (§48) — no `any`

## PWA (§56)
- **Implementable (2026-09-16)** — installed `vite-plugin-pwa@1.3.0` (Vite 8 compatible) + `@vite-pwa/assets-generator` (icons from `public/logo.svg`: `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico`).
- `vite.config.ts` — `VitePWA` with `strategies: 'injectManifest'`, `srcDir: 'src'`, `filename: 'firebase-messaging-sw.ts'` (built → `dist/firebase-messaging-sw.js`), `injectRegister: false`, `registerType: 'autoUpdate'`, `manifest` name/short_name `StaffFlow`, `start_url '/'`, `display standalone`, `theme_color`/`background_color` `#00a884`.
- **Single merged service worker** — `src/firebase-messaging-sw.ts` = Workbox precache (app shell) + SPA `NavigationRoute` fallback + Firebase messaging background handling (compat `importScripts` 10.14.1, reads `?config=` query param, `skipWaiting()` + `clients.claim()`). FCM registration URL `/firebase-messaging-sw.js?config=…` is unchanged — no SW scope conflict.
- Registration — `src/main.tsx` calls `ensurePwaSw()` (in `src/services/fcm/fcm.service.ts`) on `window.load`, independent of push permission/Firebase config; `fcmService.init()` reuses the same registration for `getToken`.
- `public/firebase-messaging-sw.js` deleted (replaced by the built SW; a public copy would shadow it in `dist`).
- Offline = app shell only (Workbox does not touch the cross-origin API on `localhost:3001`); Google Fonts (Inter) are CDN-loaded, not precached.
- Goal: employee experience installable on mobile (done).

## Google Maps (§38)
- Isolated `GoogleMap` component with office marker, current location, distance, radius visualization, location selection
- Graceful fallback when `VITE_GOOGLE_MAPS_API_KEY` empty or unavailable — app never breaks without Maps

## Key Config Files
- `vite.config.ts` — Vite + React + Tailwind plugins, path alias, port 3000
- `tsconfig.json` — Strict TypeScript config with path aliases
- `src/index.css` — Tailwind v4 `@theme` blocks + CSS variable design tokens
- `src/config/index.ts` — Centralized app configuration (branding, defaults incl. `defaultOfficeRadius = 500`)
