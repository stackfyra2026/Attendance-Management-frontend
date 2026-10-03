# StaffFlow — Active Context

## Single Device Login per Day — IMPLEMENTED (2026-09-17, spans web + Capacitor)
Feature flag on backend: one account per device per day. Frontend (this repo) sends `X-Device-Id`
on EVERY request via the axios request interceptor (`src/services/http/request.ts`), sourced from
`src/services/device.service.ts` (NEW) — a UUID stored once via the storage abstraction
(`localStorage` web / `@capacitor/preferences` native) under `attendflow.device-id`, single-flight
init, intentionally NEVER cleared on logout. `DEVICE_SESSION_BLOCKED` added to the FE
`ApiErrorCode` union (`src/services/http/errors.ts`) so the backend 403 surfaces through the
existing login error path. Backend counterpart: NestJS `DeviceSession` model + config flags
(see backend memory-bank). When the flag is off, the header is harmless.

## Current Focus
**Capacitor mobile migration COMPLETE (2026-09-17).** All 13 phases done: capacitor core + android/ios projects (1), platform detection + version (2), native geolocation (3), camera abstraction + ImagePicker (4), native push (5), secure storage (6), force update (7), back button + status bar + splash (8), network + keyboard (9), deep linking (10), permissions (11), build scripts + .env/.env.example + CAPACITOR_SETUP.md (12), memory bank (13). `npx tsc --noEmit` + `npm run build` + `npx cap sync` all exit 0. Remaining manual/ops items: branded icons (`npx @capacitor/assets generate`), google-services.json for FCM, iOS APNs entitlement, App/Universal link verification, Android release keystore — all documented in CAPACITOR_SETUP.md.

## Phase 13 COMPLETE (2026-09-17 — memory bank)
Updated `02-active-context.md`, `04-tech-context.md`, `05-progress-log.md`.

## Phase 12 COMPLETE (2026-09-17 — build scripts, setup docs)
`package.json` scripts added: `cap:sync` (build + sync), `cap:android`/`cap:ios` (build+sync+open), `cap:run:android`/`cap:run:ios`, `cap:doctor`. `.env.example` created (VITE_APP_NAME, VITE_API_BASE_URL, VITE_GOOGLE_MAPS_API_KEY, VITE_FIREBASE_* keys). `CAPACITOR_SETUP.md` (NEW) — prerequisites, daily workflow, capacitor.config mapping, push setup (google-services.json / APNs), camera/gallery/location strings, icon/splash generation, deep-link setup (staffflow:// + App Links + Universal Links), force-update endpoint contract, release gotchas. `.gitignore` already covers android/, ios/, .capacitor/, `!.env.example`.

## Phase 11 COMPLETE (2026-09-17 — permissions configuration)
Android `AndroidManifest.xml` — added `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `CAMERA`, `POST_NOTIFICATIONS` + non-required `<uses-feature>` camera/gps. iOS `Info.plist` — added `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSLocationWhenInUseUsageDescription` (previously absent — would crash on native camera/location use).

## Phase 10 COMPLETE (2026-09-17 — deep linking)
`src/services/native/deep-link.ts` (NEW) — `parseDeepLink()` (pathname+search), `getLaunchUrl()` (`App.getLaunchUrl` — cold start), `subscribeDeepLinks()`. `NativeChrome.tsx` navigates via React Router on both cold start and `appUrlOpen`. Android `AndroidManifest.xml` — VIEW intent filters: `https://app.staffflow.com` (autoVerify) + `staffflow://open`. iOS `Info.plist` — `CFBundleURLTypes` (staffflow scheme).

## Phase 9 COMPLETE (2026-09-17 — network + keyboard)
`src/services/native/network.ts` (NEW) — `getConnectivity()` + `subscribeConnectivity()` via @capacitor/network (web fallback `navigator.onLine`). `src/components/native/OfflineBanner.tsx` (NEW) — sticky `bg-danger` banner (safe-area-top) shown when native-only connectivity reports offline. Keyboard handled declaratively in `capacitor.config.ts` (resize: body, DARK) — no runtime code needed.

## Phase 8 COMPLETE (2026-09-17 — back button, status bar, splash)
`src/services/native/back-button.ts` (NEW) — `subscribeBackButton()` (`App.addListener('backButton')`; canGoBack → `window.history.back()` else `window.confirm` exit) + `exitApp()`. `src/hooks/useBackButton.ts` (NEW) — mounts/unmounts the listener. `src/components/native/NativeChrome.tsx` (NEW) — mounts inside `<BrowserRouter>` (AppRouter) ONCE for all screens: useBackButton + runtime StatusBar (#00a884, Style.Dark) + OfflineBanner (added Phase 9). Splash screen already configured in capacitor.config.ts.

## Phase 7 COMPLETE (2026-09-17 — app version + force update)
`src/services/native/force-update.ts` (NEW) — `checkForForceUpdate()`: native-only; `getAppVersion()` vs backend `GET {api}/app/version` (`{android:{minimumVersion,latestVersion,forceUpdate,storeUrl}, ios:{…}}`); `compareVersions()`; `openStore()`. Endpoint added: `API.app.version = "/app/version"`. `src/components/native/ForceUpdateScreen.tsx` (NEW) — full-screen block (current vs latest versions, Update Now → store). `src/components/native/ForceUpdateGate.tsx` (NEW) — mounted in `main.tsx` around AppRouter; shows gate only if `forceUpdate`. Missing endpoint/non-native → skipped silently.

## Phase 6 COMPLETE (2026-09-17 — secure storage abstraction)
`src/services/storage/secure-storage.ts` (NEW) — `storageGet/Set/Remove`: native → `@capacitor/preferences`, web → `localStorage` (try/catch guards). `src/services/storage/index.ts` barrel. `session.ts` rewritten ASYNC (`getAccessToken/getRefreshToken/getTokens/setTokens/setAccessToken/clear` all Promise-based; same keys `attendflow.access-token`/`attendflow.refresh-token`). `request.ts` — request interceptor now async; `doRefresh()` awaits getTokens/setTokens/clear. `authSlice.ts` — all session calls awaited.

## Phase 1 COMPLETE (2026-09-17 — Capacitor core)
Installed @capacitor/core@8, @capacitor/cli@8, @capacitor/android, @capacitor/ios + camera/geolocation/push-notifications/preferences/network/app/keyboard/status-bar/splash-screen. Created `capacitor.config.ts` (`androidScheme: "https"`, SplashScreen #00a884, StatusBar DARK, Keyboard resize:body). `npx cap add android` + `npx cap add ios` succeeded on Windows (both native projects generated). `.gitignore` now ignores `android/`, `ios/`, `.capacitor/`, keeps `!.env.example`. `npm run build` + `npx cap sync` exit 0.

## Phase 2 COMPLETE (2026-09-17 — platform detection + version)
`src/services/native/platform.ts` (`isNativePlatform/isAndroid/isIOS/isWeb/getPlatform` via `@capacitor/core` `Capacitor`), `src/services/native/version.ts` (`getAppVersion()` → AppVersionInfo; native `App.getInfo()`, web `config.version`). Barrel `src/services/native/index.ts` deferred until all modules exist (Phase 7).

## Phase 3 COMPLETE (2026-09-17 — geolocation native plugin)
`src/services/native/location.ts` (`getCurrentNativePosition()`, `checkLocationPermissions()`, `requestLocationPermissions()`, `NativeLocationError`, own `GeolocationResult` to avoid FE circular import). `src/services/location.service.ts` now branches: native → Capacitor Geolocation, web → existing `navigator.geolocation`. No caller changes (LocationVerification/CheckOutSheet/attendance slice untouched). Permissions mapped (`prompt-with-rationale` → `prompt`).

## Phase 4 COMPLETE (2026-09-17 — camera native plugin)
`src/services/native/camera.ts` (`takePicture`, `pickFromGallery`, `pickPhotoFromGallery`, `mediaToFormData`, `PickedMedia`, `CameraPickError`; native Camera v8 `takePhoto`/`chooseFromGallery`, web `<input type=file>` fallback; `fetch(uri)` → Blob → File). `src/components/ui/ImagePicker.tsx` (preview + Camera/Gallery buttons + toasts). App has no live camera UI yet — abstraction ready for future consumers.

## Phase 5 COMPLETE (2026-09-17 — push notifications native plugin)
`src/services/native/notifications.ts` (`registerForNativePush` single-flight, `onNativePushMessage`/`onNativePushActionPerformed`, `unregisterNativePush`, `shouldUseNativePush`; Capacitor `pushNotificationReceived`/`pushNotificationActionPerformed` events; schema→app `Notification` mapping). `useFcmPush.tsx` branches: native → register + backend token (`android`/`ios`) + listeners with tap→link nav; web → existing FCM SW flow. `fcm.service.ts` untouched (web-only). Android needs google-services.json + iOS needs APNs entitlement for real token delivery (documented).

## Active Decisions
- **BrowserRouter kept** — verified compatible with Capacitor WebView (local HTTP server); no HashRouter switch (user decision).
- **Native push added alongside web FCM** — @capacitor/push-notifications for Android (FCM) / iOS (APNs); web FCM untouched for browsers (user decision).
- **@capacitor/preferences for token storage** — native key-value preference store replaces localStorage on device; localStorage fallback on web (user decision).
- **Full camera implementation now** — reusable `src/services/native/camera.ts` abstraction with web `<input type=file>` fallback (user decision).
- **@react-google-maps/api kept** — JS-based maps work in Capacitor WebView; no @capacitor/google-maps rewrite (user decision).

--- StaffFlow is now an installable, standalone, offline-app-shell PWA via `vite-plugin-pwa@1.3.0` (`injectManifest`). The single service worker (`src/firebase-messaging-sw.ts` → `dist/firebase-messaging-sw.js`) merges Workbox precaching + SPA navigation fallback with the FCM background-push handler, so background push notifications keep working (same `/firebase-messaging-sw.js?config=…` registration URL — no scope conflict). Registered unconditionally on `window.load` via `ensurePwaSw()` in `main.tsx`. Icons generated from `public/logo.svg`. Manifest: name/short_name **StaffFlow**, `#00a884` theme/background, `display: standalone`. `theme-color` in `index.html` updated `#4F46E5` → `#00a884`. `npx tsc --noEmit` + `npm run build` exit 0; preview smoke passed. Offline = app shell only (cross-origin API untouched; fonts not precached).

## Demo login restored (2026-09-17)
The "Rahul" demo account (default pre-filled on `LoginPage.tsx` with `rahul@attendflow.in` / `password`) returned **"Invalid email or password"** because that user no longer existed in the backend DB — `prisma/seed.ts` was re-seeded at some point to generate 60 employees as `emp001@attendflow.in`–`emp060@attendflow.in`, so Rahul only existed as `emp001@attendflow.in` (EMP1001). `priya@attendflow.in` / `admin@attendflow.in` still worked.

Fixed:
- Backend `prisma/seed.ts` — employee loop special-cases `empIndex === 0` → email `rahul@attendflow.in` (businessEmail + loginEmail) instead of `emp001@attendflow.in`, so future re-seeds reproduce a working demo account (index 0 already resolves to "Rahul Sharma").
- Live DB patched (no full reset): `User.email` + `Employee.businessEmail`/`loginEmail` of EMP1001 → `rahul@attendflow.in`. No UNIQUE conflicts; linked data/ids untouched.
- Verified: BE `npm run build` clean; live login of all 3 demo accounts returns 200 — Rahul Sharma [EMPLOYEE], Priya Patel [MANAGER], Vikram Mehta [ADMIN], all password `password`.

## Recent Changes (Session 2026-09-16 — PWA)

- [x] `npm i -D vite-plugin-pwa@1.3.0 @vite-pwa/assets-generator`; ran `pwa-assets-generator --preset minimal-2023` on `public/logo.svg` → `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico`.
- [x] `vite.config.ts` — `VitePWA` plugin: `strategies: 'injectManifest'`, `srcDir: 'src'`, `filename: 'firebase-messaging-sw.ts'`, `injectRegister: false`, `registerType: 'autoUpdate'`, `injectManifest.globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']`, manifest (StaffFlow, standalone, portrait, `#00a884`, 4 icons incl. maskable).
- [x] `src/firebase-messaging-sw.ts` (NEW) — merged SW. TS caveat: Workbox v7 types already declare `ServiceWorkerGlobalScope.__WB_MANIFEST` — do NOT re-declare it. `importScripts` gstatic compat firebase 10.14.1 kept; final built file is a self-contained classic script (valid `importScripts`).
- [x] Deleted `public/firebase-messaging-sw.js` (would shadow the generated SW in `dist`).
- [x] `src/services/fcm/fcm.service.ts` — added `ensurePwaSw()` / `ensureServiceWorker()` (deduped promise, registers regardless of Firebase config/permission); `init()` now reuses the shared registration.
- [x] `src/main.tsx` — `ensurePwaSw()` on `window.load`.
- [x] `index.html` — apple-touch-icon + favicon.ico links, `mobile-web-app-capable`, `apple-mobile-web-app-title`=StaffFlow, `theme-color` → `#00a884`. Manifest link auto-injected at build.
- [x] `EmployeeFormPage.tsx:249` placeholder `name@staffflow.in` left as-is (cosmetic; unrelated to login).
- [x] Verified: `npm run build` exit 0; `npm run preview` smoke — `manifest.webmanifest` 200 (566B), `/firebase-messaging-sw.js` 200 (contains `importScripts` + FCM `showNotification` logic), `/` 200.
**StaffFlow Rename & Custom Date/Time/Select Input Controls COMPLETED (2026-09-16).** Replaced all occurrences of application branding to **StaffFlow**. Upgraded all native `<input type="date">`, `<input type="time">`, and `<select>` elements with custom accessible `DatePicker` (popover calendar grid), `TimePicker` (popover hour/min/preset picker), and `Select` (custom popover dropdown with search filter). Retained exact layout dimensions, form schemas, and API value formats (`YYYY-MM-DD`, `HH:mm`, select value strings). `npx tsc --noEmit` and `npm run build` exit 0 cleanly.

**Comprehensive SaaS UI/UX Polish & Standardisation COMPLETED (2026-09-16).** Standardized UI component primitives, typography, borders, focus rings, status badges, buttons, cards, inputs, datatables, modals, tabs, dropdowns, and sidebars across the entire application to a modern SaaS standard. Kept exact layout dimensions (`w-64` / `w-20` sidebar, `h-16` header), page widths, container max-widths, routing, and business logic 100% intact. `npx tsc --noEmit` + `npm run build` exit 0 cleanly.

**Check-in location accuracy gate REMOVED (2026-09-16).** Per user: "no need check location accuracy only check current lat long has or not company lat long in circle area". Check-in `LocationVerification.tsx` no longer rejects low-accuracy positions — location is validated purely by Haversine distance vs the office geofence circle (`distance <= office.radiusMeters`). Accuracy is still captured/stored as a diagnostic (and still displayed in the VERIFIED view). Removed `LocationStatus.LOW_ACCURACY`, `isLowAccuracyAccuracy()`, config `location.maxAccuracyMeters`, and the SatelliteDish/UI branch. Check-out (`CheckOutSheet.tsx`) already was circle-only — unchanged. `npx tsc --noEmit` exit 0.

**Dashboard "Department Attendance" chart replaced with "Office Attendance" (Session 2026-09-16).** Per user: "remove Department Attendance and add office/shop Attendance in dashboard". The admin dashboard's second chart was fed by `getDepartmentStats()` → `GET /dashboard/department-stats`, which the backend never exposed (it had `GET /dashboard/office-stats` returning `{ office, total, present, absent, late }`) — so the department chart was broken/404. Frontend rewired: `API.dashboard.officeStats`, renamed `getDepartmentStats()`→`getOfficeStats()`, `DepartmentStat`→`OfficeStat` (`office` key), `AdminDashboardPage` now renders "Office Attendance" stacked BarChart (`dataKey="office"`) from real office data. Backend e2e test updated to hit `/dashboard/office-stats` + expect `office` key. Deleted dead `DepartmentAttendance` type. Verified: FE `tsc` + `build` exit 0; BE `build` + `lint` exit 0; live smoke admin login → office-stats returns 3 offices (Delhi/Mumbai/Bangalore) with correct shape.
**Forgot password with email OTP (via Resend) implemented end-to-end.** Backend `POST /auth/forgot-password` now generates a 6-digit OTP (stored as sha256 in the new `PasswordResetOtp` table, 10-min expiry, 5-attempt lockout, 60s resend cooldown → `RATE_LIMITED` 429), dispatches it via a new `MailModule` (Resend SDK; graceful dev fallback logs the OTP in non-production when sending fails/unconfigured) and honors Resend's own `RATE_LIMITED` throttle. New `POST /auth/verify-otp` (validates WITHOUT consuming) and `POST /auth/reset-password` (was a 501 stub) consume the OTP, hash+save the new password (min 6), revoke ALL refresh tokens, and audit. Frontend `ForgotPasswordPage` is now a 3-step wizard (Email → 6-box `OtpInput` + Resend button with 60s countdown → New password + confirm), fully RHF+Zod. New error codes: `OTP_INVALID`, `OTP_EXPIRED`, `OTP_ATTEMPTS_EXCEEDED` (BE + FE). `npx tsc --noEmit` + `npm run build` exit 0 on FE; BE build+lint clean. Migration `20260916060054_password_reset_otp` applied.

**Real logo implemented.** Added `src/components/ui/Logo.tsx` (renders `public/logo.svg` — the 24-hour-clock app icon) and wired it into the brand mark everywhere: `Brand.tsx` (TopBar, Admin/Manager sidebars, admin/manager/employee layout headers), `LoginPage.tsx`, and `ForgotPasswordPage.tsx` (both now 64px `<Logo size="xl" />`). This replaces the old text "AF" chips. Removed a pre-existing unused `TeamsPage` import (`TS6133`, route commented out) so the build is green. `npx tsc --noEmit` + `npm run build` both exit 0. Favicon already `favicon.svg` (identical file).

**Corrections pages now 3 tabs: Check-In/Out + Corrections + History (admin & manager).** Both admin and manager attendance-corrections pages present inline `ManualAttendanceForm` (Check-In/Out tab), a new `DirectCorrectionForm` (**Corrections** tab — pick employee+date → previews existing attendance record → edit check-in/out/status + reason, applied immediately with NO approval), and a read-only **History** tab. New backend endpoint `POST /attendance/corrections/direct` (Roles ADMIN/MANAGER, `attendance.review`) applies the attendance change AND creates an `APPROVED` `CorrectionRequest` (reviewedBy = actor) so direct corrections appear in History. **Manager notifications**: sidebar + bell link route render the shared `NotificationsPage` inside `ManagerLayout` for MANAGER role (redirect wired in `AdminNotificationsGate`). **.env.example** deleted from FE + BE. `npx tsc --noEmit` + `npm run build` exit 0; BE build+lint clean; live smoke all passing; smoke records cleaned.

**Checkout/check-in "Validation failed" bug FIXED** — root cause: GPS `position.coords.accuracy` occasionally reports > 5000m (degraded signal), and `CheckOutDto`/`CheckInDto` `locationSchema` had `accuracy: z.number().min(0).max(5000)` → hard `VALIDATION_FAILED` 400. Fix: accuracy is a stored diagnostic only (fence decision uses distance), so the DTOs now clamp instead of reject: `z.number().optional().transform(v => v === undefined ? 0 : Math.min(5000, Math.max(0, v)))` (replaces `.default(0)`; NaN/Infinity still throw `invalid_type`). Zod v4 has no `.clamp()`. Verified live: checkout with accuracy 6200 → 200, stored accuracy 5000; reason-only checkout unchanged. Backend rebuilt + restarted on :3001.

## Recent Changes (Session 2026-09-16 — Remove location accuracy gate)

- `src/components/location/LocationVerification.tsx` — removed `isLowAccuracyAccuracy` + `SatelliteDish` imports, the LOW_ACCURACY status branch in `verify()` (now goes straight to distance check), the LOW_ACCURACY render block, and its `statusTitle`/`defaultMessage` cases. `StatusIcon` map no longer has a LOW_ACCURACY key. Accuracy still shown in VERIFIED view.
- `src/types/enums.ts` — removed `LocationStatus.LOW_ACCURACY` (kept the `Record<LocationStatus, ...>` map valid).
- `src/services/location.service.ts` — removed now-dead `isLowAccuracyAccuracy()`. `getCurrentPosition()` unchanged (`enableHighAccuracy` + timeout still applied).
- `src/config/index.ts` — removed unused `location.maxAccuracyMeters` (interface + value).
- **User decision**: check-in now succeeds whenever the user's lat/long falls inside the office circle regardless of GPS-reported accuracy; low-accuracy positions outside the radius show "Outside attendance area" (with "Check In With Reason" override) as before.
- Verified: `npx tsc --noEmit` exit 0.

## Recent Changes (Session 2026-09-16 — Office Attendance dashboard chart)

- `src/services/http/endpoints.ts` — `API.dashboard.departmentStats` → `API.dashboard.officeStats = "/dashboard/office-stats"`.
- `src/services/api/report.api.ts` — `getDepartmentStats()` → `getOfficeStats()` hitting `/dashboard/office-stats` (the backend's real endpoint — old URL 404'd).
- `src/services/dashboard.service.ts` — `DepartmentStat` interface renamed `OfficeStat` (`office` key instead of `department`).
- `src/pages/admin/AdminDashboardPage.tsx` — state `departments`→`offices` (`OfficeStat[]`), calls `getOfficeStats()`, chart title "Department Attendance" → **"Office Attendance"**, `dataKey="department"` → `office`.
- `src/types/index.ts` — removed unused `DepartmentAttendance` interface (dead code).
- Backend `test/app.e2e-spec.ts` — dashboard test now hits `/dashboard/office-stats` and expects `office` key; `memory-bank/07-api-specification.md` line updated.
- Verified: FE `npx tsc --noEmit` + `npm run build` exit 0; BE `npm run build` + `npm run lint` exit 0; live smoke admin token → `GET /dashboard/office-stats` = `[{office:"Delhi Office",total:40,present:1,absent:39,late:0},{office:"Mumbai Office",...},{office:"Bangalore Office",...}]`.
- `DashboardService.getOfficeStats()` already existed server-side — **no backend code changes** (only test + memory-bank doc).

## Recent Changes (Session 2026-09-16 — Forgot password via email OTP, Resend)

**Backend (Attendance Management-backend)**
- `npm i resend` (resend@6.28.1).
- `prisma/schema.prisma` — new `PasswordResetOtp` model (id, userId FK cascade, otpHash, expiresAt, usedAt?, attempts default 0, createdAt, `@@index([userId])`) + `User.passwordResetOtps` relation; migration `20260916060054_password_reset_otp` applied + `prisma generate` (had to kill stale backend dev processes to free the Prisma engine DLL).
- `src/config/configuration.ts` — `resend: { apiKey, fromEmail (default "AttendFlow <no-reply@attendflow.in>"), otpLength 6, otpTtlMinutes 10, otpMaxAttempts 5, resendCooldownSeconds 60 }`, env overrides `RESEND_FROM_EMAIL`, `RESET_OTP_LENGTH`, `RESET_OTP_TTL_MINUTES`, `RESET_OTP_MAX_ATTEMPTS`, `RESET_OTP_RESEND_COOLDOWN`.
- `src/modules/mail/` (NEW) — `mail.module.ts` (@Global; registered in `app.module.ts`) + `mail.service.ts`: wraps `new Resend(apiKey)`, `sendOtpEmail({toEmail, recipientName, otp, expiresInMinutes})` returns boolean, NEVER throws (logs `[Mail]` errors; in non-production when apiKey unset or send failed, logs the OTP to console as fallback). Handles Resend's `RATE_LIMITED` (→ treated as send failure).
- `dto/verify-otp.dto.ts` (NEW) — `VerifyOtpDto { email, otp }`, `otpSchema` `/^\d{6}$/`. `dto/reset-password.dto.ts` (NEW) — `ResetPasswordDto { email, otp, newPassword }`, `newPassword` min 6 max 128.
- `common/errors/api-error-codes.ts` — added `OTP_INVALID`, `OTP_EXPIRED`, `OTP_ATTEMPTS_EXCEEDED`.
- `auth.controller.ts` — added `POST /auth/verify-otp` (200 `{ message }`); implemented `POST /auth/reset-password` (200 `{ message }`, was 501 stub); removed unused `ApiException` import.
- `auth.service.ts` — injects `MailService`; new `otpConfig` getter; `forgotPassword(email, ip?)`: generic anti-enumeration success, skips inactive users, cooldown → `RATE_LIMITED` 429 w/ `waitSeconds`, transaction invalidates old OTPs + creates new (sha256 via `CryptoUtil.sha256`), `mailService.sendOtpEmail`. `verifyOtp(email, otp)`: validates WITHOUT consuming. `resetPassword(email, otp, newPassword, ip?)`: transaction → update passwordHash (`HashUtil.hashPassword`), mark OTP used, revoke ALL refresh tokens, audit `password_reset`. `generateOtp()` (`randomInt`) + `assertOtpMatches(dto, ip?)`: increments attempts, consumes OTP on 5th mismatch.
- Verified: `npm run build` + `npm run lint` exit 0.

**Frontend (Attendance Management)**
- `services/http/endpoints.ts` — `API.auth.verifyOtp = "/auth/verify-otp"`, `API.auth.resetPassword = "/auth/reset-password"`.
- `services/api/auth.api.ts` — `forgotPassword(email)`, `verifyOtp(email, otp)`, `resetPassword(email, otp, newPassword)`.
- `services/http/errors.ts` — `ApiErrorCode` union gained `OTP_INVALID`, `OTP_EXPIRED`, `OTP_ATTEMPTS_EXCEEDED`.
- `components/ui/OtpInput.tsx` (NEW) — 6 single-digit boxes (`inputMode="numeric"`), auto-advance, backspace, paste, autofill, error/disabled props.
- `pages/auth/ForgotPasswordPage.tsx` — complete rewrite to 3-step wizard (`StepIndicator`, `OtpInput`, 60s Resend countdown `RESEND_COOLDOWN_SECONDS`, RHF+Zod for email + password/confirm, success screen). OTP-reset failures mapped back to step 2 (`OTP_INVALID`/`OTP_ATTEMPTS_EXCEEDED` → allow resend; `OTP_EXPIRED` → message only). Uses `bg-primary-50 dark:bg-primary-900/30` (NOT `bg-primary/20`, which v4 won't generate for the custom `--primary` raster class).
- Verified: `npx tsc --noEmit` + `npm run build` exit 0 (both require the FE error-code union update).

## Recent Changes (Session 2026-09-16 — Real logo implemented)

- `src/components/ui/Logo.tsx` (NEW) — renders `/logo.svg` from `public/`; `size` sm/md/lg/xl (`h-8`→`h-16`), `className`, `alt`.
- `src/components/layout/Brand.tsx` — mark switched from the `bg-primary`/"AF" chip to `<Logo size="sm" />` (sidebars + layout headers pick it up automatically).
- `src/pages/auth/LoginPage.tsx` + `src/pages/auth/ForgotPasswordPage.tsx` — "AF" chips replaced with `<Logo size="xl" className="mx-auto mb-4" />`.
- `src/app/router/AppRouter.tsx` — removed unused `TeamsPage` import (route still commented out) — fixes pre-existing `TS6133` that blocked `tsc`/`build`.
- `public/logo.svg` already existed (identical to `favicon.svg`); favicon unchanged.
- Verified: `npx tsc --noEmit` + `npm run build` exit 0.

## Recent Changes (Session 2026-09-15 — /team route restructure + Notifications infinite scroll)

**Frontend (Attendance Management)**
- `/team/me*` manager self-service routes renamed to flat `/team/*`: `me`→`dashboard`, `me/attendance`→`attendance`, `me/attendance/monthly`→`attendance/monthly`, `me/leave`→`leave`, `me/leave/apply`→`leave/apply`, `me/notifications`→`notifications`, `me/profile`→`profile`. `/team` index keeps `TeamOverviewPage`. Updated: `AppRouter.tsx` (routes + manager notification redirect), `ManagerLayout.tsx` (TopBar profile/notifications props), `utils/roles.ts` (`homeForRole(MANAGER)` → `/team/dashboard`), `ManagerSidebar.tsx` (My Account nav), `LeavePage.tsx`/`ApplyLeavePage.tsx` (base `/team/me` → `/team`). No `/team/me` references remain.
- `NotificationsPage.tsx` — client-side **infinite scroll**: `PAGE_SIZE = 20`, IntersectionObserver on bottom sentinel (`rootMargin 150px`, 300ms load-more) reveals items in chunks; `SkeletonCard` indicator; sentinel removed when all items shown. API still returns all notifications (no backend pagination).

## Recent Changes (Session 2026-09-15 — Formal "Corrections" tab: direct apply + approved history, admin & manager)

**Backend (Attendance Management-backend)**
- `dto/direct-apply-correction.dto.ts` (NEW) — `DirectApplyCorrectionDto`: `employeeId`, `date` (yyyy-MM-dd), optional `checkIn`/`checkOut` (HH:mm)/`status`, required `reason` (5–500). Zod schema + refines mirroring `ManualAttendanceDto` (≥1 of in/out/status; check-out requires check-in).
- `corrections.controller.ts` — new `POST /attendance/corrections/direct` (`@Roles('ADMIN','MANAGER')` + `@Permissions('attendance.review')`, message "Correction applied successfully").
- `corrections.service.ts` — new `directApply(userId, dto, ip?)`: guards role (ADMIN/MANAGER) + manager-direct-report (403 otherwise, same rule as `manualPunch`); mirrors `manualPunch` time/status/working-hours derivation (module-local `istWallInstant`/`utcMidnight`/`indiaMinutes`/`timeToMinutes` — was attendance-module-local); in ONE transaction updates-or-creates the `Attendance` row for `(employeeId, date)` and creates a `CorrectionRequest` with `status: APPROVED`, `requestedBy`+`reviewerId`=actor, `reviewedAt=now`, `original*` from the pre-apply record (`INCOMPLETE` when none), `corrected*` from applied values. Two audit entries: attendance CREATE/UPDATE + correction `APPLY`. Returns serialized correction.
- Verified live: admin direct apply → approved entry top of `GET /attendance/corrections?status=approved`; manager direct apply on same date updated the record (`originalStatus: late` → corrected); check-out-without-check-in → 400 with zod issue. Backend rebuilt + restarted on :3001 (it was running stale `dist/main`).

**Frontend (Attendance Management)**
- `src/services/http/endpoints.ts` — `API.attendance.correctionsDirect = "/attendance/corrections/direct"`.
- `src/services/api/attendance.api.ts` — new `applyDirectCorrection({ employeeId, date, checkIn?, checkOut?, status?, reason })` → `POST correctionsDirect` → `mapCorrection`.
- `src/components/attendance/DirectCorrectionForm.tsx` (NEW) — employee+date selects auto-set RHF values from the previewed record (`attendanceService.getHistory(employeeId, {from,to})`); preview panel shows current check-in/out/worked/status or "no record — will create"; edit check-in/out/status (auto/present/late/absent/half-day) + required reason; submits `applyDirectCorrection` → toast → `onRecorded()`. Same zod refines as `ManualAttendanceForm` plus required reason.
- `src/pages/admin/CorrectionsPage.tsx` + `src/pages/manager/TeamApprovalsAttendancePage.tsx` — now 3 tabs: **Check-In/Out** (`ManualAttendanceForm`) / **Corrections** (`DirectCorrectionForm`) / **History** (count badge).
- Verified: `npx tsc --noEmit` + `npm run build` exit 0.

---

## Recent Changes (Session 2026-09-15 — Tabbed Corrections + Manager Notifications + .env.example removal)

**Frontend (Attendance Management)**
- `src/components/attendance/ManualAttendanceForm.tsx` (NEW) — inline Card form reusing the modal's RHF + Zod schema + `attendanceService.manualPunch`; props `employeeOptions`, `onRecorded`. No modal needed.
- `src/components/attendance/ManualAttendanceModal.tsx` — deleted (no longer used).
- `src/pages/admin/CorrectionsPage.tsx` — rewrite: Tabs **Check-In/Out** (renders `ManualAttendanceForm`) / **History** (read-only list of all `CorrectionRequest` with status badge). Removed: Pending tab, approve/reject handlers, `ReviewTarget`, `ConfirmDialog`, `useToast`, `useAppSelector`.
- `src/pages/manager/TeamApprovalsAttendancePage.tsx` — same tab rewrite with direct-report employee options; heading renamed to "Attendance Corrections"; removed approve/reject UI.
- `src/pages/manager/TeamOverviewPage.tsx` — removed unused `pendingCorrections` state + commented-out StatCard + orphaned `attendanceService` import (eliminated TS6133).
- `src/components/layout/ManagerSidebar.tsx` — `Bell` icon import + new nav item `Notifications → /team/me/notifications`.
- `src/app/router/AppRouter.tsx` — `AdminNotificationsGate` extended: MANAGER → `/team/me/notifications`; new route `me/notifications` under `/team`.
- `src/app/layouts/ManagerLayout.tsx` — `<TopBar>` now passes `notificationsTo="/team/me/notifications"`.
- `.env.example` deleted (FE).
- Verified: `npx tsc --noEmit` + `npm run build` exit 0.

**Backend (Attendance Management-backend)**
- `.env.example` deleted (BE).
- No other changes; `POST /attendance/manual` contract unchanged.

**Verification — live API smoke**
- Admin login + `GET /attendance/corrections` → 2 existing requests.
- Manager Priya login + same endpoint → team-filtered 2 requests.
- Manager Priya manual punch direct report Rahul → 200, `status: late`, 8.12h. Smoke record deleted via `prisma db execute`.
- `npm run build` + `npm run lint` exit 0 on backend.

## Recent Changes (Session 2026-09-15 — Attendance/Leave Event Push Notifications, backend)

**Backend (Attendance Management-backend)**
- `npm i @nestjs/schedule`; `app.module.ts` — `ScheduleModule.forRoot()` added.
- `attendance.module.ts` — now `imports: [NotificationsModule]`, `providers: [AttendanceService, AttendanceReminderService]`.
- `attendance.service.ts` — injects `NotificationsService`. `getEmployee()` include now selects `manager: { select: { userId } }`. New helpers `formatTime12h(date)` / `formatWorked(minutes)`. After `checkIn()` (both initial + re-check-in) → `notifyCheckedIn`: user `Checked in / You checked in at <12h>` (link `/attendance`, type ATTENDANCE) + manager `Team check-in / <Name> (<EMP####>) checked in at <time>` (link `/team/employees`). After `checkOut()` → `notifyCheckedOut` (parallel messages with `· worked <xh>`) then if `shift` exists and `timeToMinutes(endTime) > timeToMinutes(startTime)` and `indiaMinutes(now) < end − earlyCheckoutMinutes` → `notifyEarlyCheckout` (user `Early checkout alert / checked out before scheduled shift end (<endTime>)`; manager variant names employee). Shared `notifyManager()` skips when no manager or manager === self.
- `leaves.service.ts` — `getEmployee()` now also selects `manager.userId`; `apply()` after create (and after UNPAID balance skip) sends manager `New leave request / <Name> (<EMP####>) applied for <type> leave <start> to <end> (<days> day(s))`, type LEAVE, link `/team/approvals/leave`; skipped when no manager.
- `attendance-reminder.service.ts` (NEW) — `@Cron('*/15 * * * *', { timeZone: 'Asia/Kolkata' })` `scan()`: resets `sentToday` Set when the IST date key changes; skips Sundays (`getUTCDay()===0`) + public holidays (`isHoliday` matches exact + recurring by MM-DD); then (1) `sendCheckOutReminders` — today's `checkIn != null && checkOut == null` records with a non-overnight shift whose `endTime` has passed → `Reminder: check out / Your shift ended at <endTime> — don't forget to check out` (link `/attendance`, ATTENDANCE); (2) `sendNoShowReminders` — active employees with a shift, no record today, non-overnight shift ended → `Missed check-in / You haven't checked in today — your shift started at <startTime>`. Dedupe keys `${employeeId}:${dateKey}:checkout|noshow`. Overnight shifts deliberately skipped (their end falls on the next calendar day — avoids wrong no-show alerts).

**Verification — live API + standalone-context smoke (all passing)**
- Manish (EMP1009) check-in/out at Delhi Office → own notifications `Checked in`/`Checked out`/`Early checkout alert`; Priya (his manager) got `Team check-in`/`Team check-out`/`Early checkout alert` naming him. Rahul's leftover open record checked out → own `Checked out · worked 24m` + `Early checkout alert`.
- Manish leave apply (casual, 2 days Oct 5–6) → Priya got `New leave request / Manish Verma (EMP1009) applied for casual leave … (2 days)` — LEAVE type, correct link payload, employee info.
- Reminder: created temp `Reminder-Test-Shift` (09:00–10:00, past end), assigned Arjun (open record today) + Sneha (no record), ran `AttendanceReminderService.scan()` via `NestFactory.createApplicationContext` → Arjun 1 check-out + Sneha 1 no-show; second `scan()` → 0 new (dedupe OK); test shift/records/notifications cleaned up after.

**Backend (Attendance Management-backend)**
- `prisma/schema.prisma` — new `FcmToken` model (userId FK, token unique, platform, createdAt/updatedAt, lastUsedAt, @@index[userId]); migration applied.
- `src/modules/push/*` (NEW) — `push.module.ts` (@Global), `fcm.service.ts`: `onModuleInit` lazy `initializeApp` (gated on `PUSH_ENABLED` + service account; catch → disabled w/ log), `buildCredential()` (JSON string / file path / `applicationDefault()`), `send(userIds, payload)` → `getMessaging().sendEachForMulticast`, prunes unregistered tokens (`messaging/registration-token-not-registered`, `messaging/invalid-registration-token`), bumps `lastUsedAt`. Uses firebase-admin module-scoped named imports (`firebase-admin/app` + `firebase-admin/messaging`) — the old `import * as admin` namespace had no `app`/`credential` types in v13.
- `src/config/configuration.ts` — `push: { enabled, projectId, serviceAccount }` from env.
- `src/modules/notifications/notifications.service.ts` — added `notify({ userIds, title, message, type, link })` (single transaction: `notification.createMany` + firebase token query + `fcm.send`) and `registerDeviceToken(userId, token, platform)` (upsert-by-token) / `revokeDeviceToken` / `clearDeviceTokens` (future cleanup). Errors swallowed → in-app-only fallback.
- `src/modules/leaves/leaves.service.ts` — approve/reject now create the notification via `this.notifications.notify(...)` (was direct `prisma.notification.create`). NOTE: leave **apply** still creates NO in-app notification (unchanged). `LeavesModule` now imports `NotificationsModule`.
- `src/modules/announcements/announcements.service.ts` — `fanOut` now calls `notifications.notify({ userIds: [active employees], ...ANNOUNCEMENT })` (was `prisma.notification.createMany`). `AnnouncementsModule` imports `NotificationsModule`.
- `src/modules/notifications/notifications.controller.ts` — added `POST /notifications/device-token` (`.dto/register-device-token.dto.ts`, token ≥10 chars, platform ≤50) and `DELETE /notifications/device-token` (same DTO body); both `@Roles('ADMIN','MANAGER','EMPLOYEE')`.
- `.env` (repo gitignored; `.env.example` files removed from FE + BE per user request) — `PUSH_ENABLED`, `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID` documented.

**Frontend (Attendance Management)**
- `npm i firebase@12.19.0`.
- `src/config/firebase.ts` (NEW) — `firebaseConfig` from `VITE_FIREBASE_*` (incl. `VAPID_KEY`), `isFirebaseConfigured()` (apiKey+messagingSenderId+projectId present), `isPushAllowedFor(user)`.
- `src/services/fcm/fcm.service.ts` (NEW) — modular SDK singleton: `ensureMessaging` (guards `isSupported()`), `registerServiceWorker` (scope `/`, URL carries config because `public/` SW can't read `import.meta.env`), `init()` (request permission → getToken with `vapidKey` → register to backend → `{status:'ready'|...}`), `stop()` (revoke backend + `deleteToken`), `onMessage(cb)` (foreground listener, returns unsubscribe).
- `src/services/fcm/useFcmPush.tsx` (NEW) — `FcmPushProvider` mounted in `main.tsx` inside `<Provider>`: on auth user change, if configured → `init()`, wire `onMessage` → `dispatch(addNotification(payload tonotification))` (data `{type,link,id}` + notification title/body → `Notification`); cleanup revokes + unsubscribes + resets so re-login re-wires (token is per-user).
- `src/services/http/request.ts` — added `delWithBody<T>` (DELETE body; required because the backend revoke endpoint takes `{ token }` in the body, and the existing `del` sends no data).
- `src/services/http/endpoints.ts` + `src/services/api/notification.api.ts` — `notifications.registerDeviceToken`/`revokeDeviceToken` endpoints + API methods.
- `src/vite-env.d.ts` — `VITE_FIREBASE_{API_KEY,AUTH_DOMAIN,PROJECT_ID,STORAGE_BUCKET,MESSAGING_SENDER_ID,APP_ID,VAPID_KEY}` (documented in `.env`, `.env.example` removed).
- `public/firebase-messaging-sw.js` (NEW) — compat SDK `importScripts` (10.14.1); `initializeApp` from `?config=` query param; `onBackgroundMessage` → `showNotification` (icon favicon, data.url = link); `notificationclick` focuses/navigates the tapped notification.

**Verification — live smoke (both builds clean)**
- `POST/GET` device-token: register → `{registered:true}`, revoke → `{revoked:true}`, re-register OK.
- Announcement create fanned out via `notify()`: admin unread-count became 1 (in-app notification created); no push attempt logged (disabled). Test announcement deleted after.

## Immediate Next Steps
1. **Provide real Firebase creds to enable push** — set `PUSH_ENABLED=true`, `FIREBASE_SERVICE_ACCOUNT` (JSON string or file path), `FIREBASE_PROJECT_ID` in `Attendance Management-backend/.env`, and `VITE_FIREBASE_API_KEY` etc. + `VITE_FIREBASE_VAPID_KEY` in FE `.env`. Restart BE. Notifications should then flow: backend `notify()` → FCM multicast → SW foreground `onMessage` (toast/in-app) + background `firebase-messaging-sw.js` (system notification).
2. **Browser QA (current UI work)** — FE :3000 / BE :3001 running. As an employee check in/out (expect Checked in/out + Early checkout alert to you and your manager), as a manager apply leave and see your reporting manager notified, and verify a shift-end reminder fires once per day per user. The `@nestjs/schedule` cron runs on the BE process (auto-started with `node dist/main`).
3. Optional later: `attendanceSlice` range support; deactivate remaining Department-session smoke records (EMP9999, IMP9001, etc.); `initialPassword` copy-to-clipboard; dark-mode + PWA polish (Phase 14).

## Forgot-Password OTP — live smoke COMPLETE (2026-09-16)
Backend running `node dist/main` on :3001 (already had the OTP code). Full flow verified against live API (user rahul@attendflow.in; demo password `password` restored after):
- forgot-password existing email → 200 generic message; **repeat within 60s → 429 `RATE_LIMITED`** `waitSeconds`; **non-existing email → 200 identical generic response** (no enumeration leak).
- verify-otp wrong → 400 `OTP_INVALID` with `remainingAttempts` countdown (3→2→1).
- exfiltrating the real OTP impossible locally (sha256 + dev-console fallback log); replaced the row's `otpHash` with sha256 of a known 6-digit code via `prisma db execute` to drive the happy path.
- verify-otp correct → 200 **without consuming**; reset-password → 200, password changed; **old password login → 401**; **pre-reset refresh token → 401 `UNAUTHENTICATED`** (revocation works); correct-OTP pseudo-reuse after reset → 400 `OTP_INVALID` "already been used".
- **5th wrong attempt → `OTP_ATTEMPTS_EXCEEDED`** (row consumed); verify after → "already been used".
- expired row (`expiresAt` rewound 1 min via db execute) → 400 `OTP_EXPIRED`.
- Cleanup: rahul password restored to `password` (hash copied from priya@attendflow.in seed row), all `PasswordResetOtp` rows for rahul deleted. OTP email delivery itself not fully confirmable (no RESEND_API_KEY; dev fallback logs OTP in the BE console window).

## Remaining OTP attention items
- `OtpInput` spread/overflow edge — no logic change needed per-digit, but visually verify autofill/focus-ring if doing browser QA.
- `POST /forgot-password` intentionally skips dispatch for unknown/disabled accounts — confirmed intended (anti-enumeration).
- Optional: auto-redirect forgot-password success → login (currently manual "Back to login" button).

## Active Decisions
- **Attendance/leave events push via `notify()`** (per user answers: "User + their manager" for check-in/out; early rule = shift end − `earlyCheckoutMinutes`; reminders include no-shows; leave apply → direct manager only). Check-in/out: user (Checked in/out, `/attendance`) + manager (Team check-in/out naming employee, `/team/employees`), type ATTENDANCE; early checkout alert = user + manager pair; leave apply → manager (New leave request, `/team/approvals/leave`, LEAVE; skipped when no manager); shift-over reminder (`AttendanceReminderService` @Cron every 15 min), checkout-reminder for open records + missed-check-in for no-shows, Sundays + public holidays + overnight shifts skipped, in-memory `${employeeId}:${dateKey}:checkout|noshow` dedupe (resets daily; one re-send risk after BE restart — accepted, no schema change).
- **FCM push = gated opt-in, matches current in-app notifications** — leave approved (requester), leave rejected (requester), announcement published (active employees), plus the attendance/leave events above. Safe without real creds: `PUSH_ENABLED=false`/no `FIREBASE_SERVICE_ACCOUNT` → FCM never initializes, `notify()` falls through to in-app; FCM errors caught + logged (never break in-app path).
- **Single role per user** — `User.role` / `Employee.role` is the one source of truth; no role switching, no `/select-role`
- **No mocks remain** — `useMockApi` deleted; all services hit the real backend
- **RBAC kept** — admin Roles & Permissions page now wired to real backend (user chose "Add backend roles/permissions API" over removing the pages)
- **Department removed from FE, optional in backend** — FE never creates/reads Department; Prisma `Designation.departmentId`/`Team.departmentId` nullable; backend `departments` module + data kept (out of removal scope)
- **Leave/corrections approval = dual visibility, single approver** — employee requests visible to direct manager AND admin; manager requests visible to admin only (per user: "IF MANAGER APPLY LEAVE THEN ONLY ADMIN APPROVE"). Either reviewer can approve/reject (reject is final, no admin override). Manager reviewers enforced to direct reports at the API level (`assertCanReview`); `approvedBy`/`reviewerId` single field stores the acting reviewer
- **Manager attendance/stat scope = direct reports** — attendance history, reports endpoints, and the `/employees` list are all manager-scoped via `viewerScope()`/forced `managerId`. Reports service scope includes `{ id: viewer.id }` (manager sees own row in report data); employee list is direct-report-only. `EmployeesModule` imports `ReportsModule` (ReportsService owns `computeMonthlySummaries`/`getAttendanceSummaries`/`getTodayStatuses`)
- **Derived "today" status semantics** — `getTodayStatuses` computes: attendance record wins (lowercased status, checkIn attached), else approved leave → `leave`, else Sunday/holiday → `null` (blank "—"), else → `absent` (immediate, per user; consistent with admin dashboard `absentToday`). Applied on admin + manager employee lists and manager dashboard cards
- **Team is department-optional too** — `Team.departmentId` nullable in schema + create DTO; FE TeamsPage create form dropped Department
- **Id validation relaxed** — org create DTOs use generic id strings (not `cuid`) to match Prisma `uuid()` — fixes live team-create bug
- **Reporting Manager hidden for Admin** — avoids circular "Admin reports to Manager" edge case
- **Role select on top** — first field in Employment section for clearer user flow
- `getCorrectionRecords()` returns `[]` in real mode → CorrectionsPage uses per-selection `getHistory` lookup (D-INT-3)
- Location validation is UX-only; Office coordinates and radius come from config/office data, never hardcoded (§16)
- Timer runs client-side from timestamps + `useNow` (D6 + D13), synced on check-out
- Indian locale for all mock data (D3)
- Flat service layer: `src/services/*.service.ts` (D8) — real API modules in `src/services/api/*.api.ts`
- Circular type imports are type-only (erased at runtime): `attendance.api` imports `MonthlyAttendance` from `attendance.service`, `report.api` imports types from `dashboard.service`/`report.service` — keep type definitions in service files

## Blockers
- **FCM push untestable end-to-end locally** — no real Firebase project/Service-Account/VAPID creds yet (by design; gated). In-app notifications remain functional.

## Recent Changes (Session 2026-09-15 — Remove Team Employees Download Button)

**Frontend (Attendance Management)**
- `src/pages/manager/TeamEmployeesPage.tsx` — removed the whole-team "Download Attendance" monthly-summary CSV button (per user: "download section in report section not Employees page"). Dropped `handleDownload`, `isDownloading`, and now-unused imports (`Download` icon, `Button`, `useToast`, `reportService`). `format` still used (`statsMonth`). Downloads remain available on `/team/reports` (admin `ReportsPage` reuse, `reports.export`).
- `src/services/permission.service.ts` — added `"reports.export"` to `DEFAULT_PERMISSIONS[Role.MANAGER]`. This is what makes the Download button appear on `/team/reports` for managers: `getRoles()` (backend `/rbac/roles`, ADMIN-only) is only called from the admin `RolesPage`, so manager sessions always use the FE defaults — the backend DB grant alone never surfaced the button.
- Verified: `npx tsc --noEmit` + `npm run build` exit 0.
- **Admin notifications now render inside `AdminLayout` (with sidebar)** — `/admin/notifications` route added under the `/admin` `AdminLayout` block; `AdminSidebar` "Notifications" item + `TopBar` bell repointed there (`TopBar` gained a `notificationsTo` prop, AdminLayout passes `/admin/notifications`); old `/notifications` path redirects ADMIN via new `AdminNotificationsGate`. Manager/employee behavior unchanged.
- **Admin notifications now render inside `AdminLayout` (with sidebar)** — `/admin/notifications` route added under the `/admin` `AdminLayout` block; `AdminSidebar` "Notifications" item + `TopBar` bell repointed there (`TopBar` gained a `notificationsTo` prop, AdminLayout passes `/admin/notifications`); old `/notifications` path redirects ADMIN via new `AdminNotificationsGate`. Manager/employee behavior unchanged.

## Recent Changes (Session 2026-09-15 — Derive Today Status + Manager Absent/Late Cards)

**Backend (Attendance Management-backend)**
- `src/modules/reports/reports.service.ts` — `getTodayStatuses(employeeIds)` reworked: parallel queries today's attendance records + today's APPROVED leave requests (`startDate <= today <= endDate`), then derives per employee: record exists → lowercased status (`present`/`late`/`absent`/`leave`/…, checkIn attached); else on approved leave → `'leave'`; else Sunday/holiday (reuses `eligibleHolidays`) → `null`; else → `'absent'`. Semantics chosen by user: absent is immediate (matches admin dashboard `absentToday = total − present − onLeave`); weekends/holidays render blank. Secret: attendance rows store `date` at UTC midnight (`utcMidnight`), so `where: { date: todayDay }` equality matches real check-in records.

**Frontend (Attendance Management)**
- `src/pages/manager/TeamOverviewPage.tsx` — added `lateToday` (status `late`) and `absentToday` (status `absent`) cards; grid now 7 cards (`grid-cols-2 sm:grid-cols-3 xl:grid-cols-7`): Team Size, Present Today, Late Today (Clock/warning), Absent Today (UserX/danger), On Leave Today, Pending Leave, Pending Approvals; skeleton updated to 7; imports `UserX` + `Clock`.
- Admin `EmployeesPage` (`AttendanceCell`) and manager `TeamEmployeesPage` (`AttendanceStatsRow`) needed **no UI changes** — they already render the today badge; the backend now populates it.

## Recent Changes (Session 2026-09-15 — Manager Reports Download + Dashboard Attendance)

**Backend (Attendance Management-backend)**
- `rbac.constants.ts` — `reports.export` added to `MANAGER_PERMISSIONS`; granted live to the MANAGER role via `prisma db execute` INSERT (verified: admin `GET /rbac/roles` shows MANAGER perms incl. `reports.export`); no code change needed for reports endpoints — `@Roles('ADMIN','MANAGER')` + `viewerScope()` already support managers

**Frontend (Attendance Management)**
- `ManagerSidebar.tsx` — "Reports" nav item (`FileText`) added to the Team section → `/team/reports`
- `AppRouter.tsx` — `/team/reports` route added under the ManagerLayout block
- `pages/manager/ManagerReportsPage.tsx` (new) — thin wrapper reusing admin `ReportsPage` (employee dropdown + report data both backend-scoped to the manager's direct reports; CSV export now visible thanks to `reports.export`)
- `pages/manager/TeamEmployeesPage.tsx` — header "Download Attendance" button: fetches `reportService.getMonthlySummary(currentMonth)` (team-scoped) and exports `team-attendance-YYYY-MM.csv` (Employee/Office/P/L/A/Leave/Hours)
- `pages/manager/TeamOverviewPage.tsx` — `getAll` now sends `statsMonth`; new stat grid (5 cards): Team Size, **Present Today** (today.status present|late), **On Leave Today** (today.status leave), Pending Leave, Pending Approvals; skeleton updated to 5

## Recent Changes (Session 2026-09-15 — Request: 3-Month Attendance History + Manager/Admin Visibility)

**Backend (Attendance Management-backend)**
- `GET /attendance/history` accepts optional `from`/`to` (yyyy-MM-dd) → `Prisma.AttendanceWhereInput` range filter (backward compatible, verified narrowing 09-13..09-15 → only 09-14); manager scoping in `resolveViewer`: MANAGER may only view own/direct-report attendance (403 `FORBIDDEN` cross-team, verified)
- `reports.service.ts`/`reports.controller.ts` — all report methods now pass `@CurrentUser()` user → `viewerScope()` helper; MANAGER viewer companies every report to direct reports; ADMIN unrestricted; `getOvertimeReport` delegates to `getAttendanceReport` (verified admin leave/overtime/attendance unscoped)
- `employees` module — `ListEmployeesQuery` gains optional `statsMonth` (yyyy-MM); `EmployeesService.list(query, viewerUserId)` resolves viewer, forces **MANAGER → `where.managerId = viewerId`** (direct reports only), attaches per-employee `attendanceStats { month, present, late, absent, leave, workingHours, today }` via new `ReportsService.getAttendanceSummaries(month, ids)` + `getTodayStatuses(ids)`; reused `computeMonthlySummaries` extraction; `EmployeesModule` imports `ReportsModule`
- Verified live: manager list returns only direct reports (19) each with `attendanceStats`; admin list returns all 64 with stats; manager cross-team history 403; admin reports endpoints unchanged

**Frontend (Attendance Management)**
- `src/types/index.ts` — `EmployeeAttendanceStats` interface + optional `attendanceStats` on `Employee`
- `src/services/api/employee.api.ts` — `statsMonth` in `EmployeeFilters`/params; raw→type mapping; `getAll` passes it; `src/services/api/attendance.api.ts` — `getHistory(options)` supports `{ from?, to? }`
- `src/components/attendance/AttendanceMonthView.tsx` (NEW) — reusable month-navigator: prev/next month buttons, 6-stat cards, Monday-start calendar grid with status dot + legend, optional day list (via `attendanceService.getMonthly`); props `employeeId`, `initialMonth?`, `showDayList?`
- `MonthlyAttendancePage.tsx` rewritten to use `AttendanceMonthView`; `AttendancePage.tsx` — "This Month" tab now has prev/next month navigation (full history fetched once, client-filtered per month)
- `EmployeeDetailPage.tsx` — Attendance tab uses `<AttendanceMonthView employeeId showDayList />` (removed local monthly fetch, `SummaryStat` helper, unused imports)
- `EmployeesPage.tsx` — new "Attendance" table column + `AttendanceCell` (today `AttendanceStatusBadge` or "—", P/L/A counts, attendance %); mobile cards show compact stats row; table fetch sends `statsMonth`
- `TeamEmployeesPage.tsx` — `employeeService.getAll` now includes `statsMonth`; each report card shows `AttendanceStatsRow` (today badge, P/L/A, %) and "View Attendance & Profile" link to detail page

## Recent Changes (Session 2026-09-14 — Request 8: EmployeeFormPage Office/Manager UX)

- `src/pages/admin/EmployeeFormPage.tsx` — Employment field order changed to Role → **Office** → Designation → Reporting Manager → Shift → Joining Date → Employment Type → Employment Status → Account Status
- Role-based visibility: role=**admin** hides the Office field and clears both `managerId` + `officeId` (per user choice); Reporting Manager remains hidden for admin
- Validation: `officeId` now optional in schema + `superRefine` requiring it when role ≠ admin (`z.ZodIssueCode.custom` issue on `officeId`); `src/types/index.ts` `EmployeeFormData.officeId` → optional
- Office-scoped managers: `managers` state now stores `{ value, label, officeId }` (from `Employee.officeId`); when an office is selected, `visibleManagers` filters to that office (no office chosen = all); effect clears `managerId` if the selected manager's office no longer matches; current manager kept selectable as a safety fallback in edit mode
- `baseSchema` split from `schema` so the load effect can still use `baseSchema.shape` (superRefine turns schema into `ZodEffects` with no `.shape`)

## Recent Changes (Session 2026-09-14 — Request 7: Dual Visibility Approval for Leave + Corrections)

**Backend (Attendance Management-backend)**
- `src/modules/leaves/leaves.service.ts` — `list()` rebuilt: ADMIN + no filter → ALL leaves; MANAGER + no filter → direct reports' (+ own) leaves via `employeeId in [viewer.id, ...reportIds]`; EMPLOYEE → own leaves only; explicit `filterEmployeeId` still supported for ADMIN/MANAGER. Added `assertCanReview(userId, requestOwnerManagerId)` used by `approve()`/`reject()`: ADMIN always allowed, MANAGER only when the request owner's `managerId` equals the reviewer's employee id, else 403. `approve`/`reject` now include `employee.managerId` in the lookup select.
- `src/modules/corrections/corrections.service.ts` — `list()` now scopes MANAGER to direct reports' corrections (was: ALL); ADMIN still sees all, EMPLOYEE still sees own. Added the same `assertCanReview` guard to `approve()`/`reject()` (lookup includes `employee.managerId`).
- No endpoint/route/DTO changes; no schema migration needed.

**Frontend (Attendance Management)**
- `src/pages/admin/AdminLeaveApprovalsPage.tsx` (new) — Admin leave-approval page mirroring `TeamApprovalsLeavePage` UX (Pending/History tabs, approve `ConfirmDialog`, reject modal with required reason); loads ALL leaves via `leaveService.getAll()` (admin sees every request). Shows employee name/ID, dates, leave type badge, days, reason.
- `src/app/router/AppRouter.tsx` — `import AdminLeaveApprovalsPage`; route `leave/approvals` added under the admin layout block.
- `src/components/layout/AdminSidebar.tsx` — new "Approvals" nav group (`ClipboardCheck` icon) with children: Leave → `/leave/approvals`, Corrections → `/attendance/corrections`; `/leave/approvals` added to default `expandedItems`.

**Verification — live API smoke tests (all passing)**
- Rahul (employee) applies leave → visible to Priya (manager) AND admin Vikram; admin approves ✓; manager Priya approves her direct report Rahul's separate request ✓
- Priya (manager) applies leave → her self-approve rejected 403 `FORBIDDEN ("You can only review leave requests from your direct reports")`; admin approves ✓
- Corrections scoping: Rahul sees own (2), Priya sees only EMP1024 (her report) corrections, admin sees all; pending set empty post-approval ✓
- Cleanup: 3 smoke-test `LeaveRequest` rows removed via `prisma db execute` (no delete endpoint).

## Open Items / Resolved Conflicts
- [DONE] §15 (`src/services/location/` dir) vs §45 (`location.service.ts`) → resolved as flat (D8)
- [DONE] LocationVerification states: 5 (old plan) → 7 per §17 (D9)
- [DONE] Attendance history + monthly calendar wired to store (§21-22)
- [DONE] Leave management wired to store (§23) — balance, apply, history, cancel
- [DONE] Profile (§24) wired to employee relations + Notifications (§25) service-backed
- [DONE] Admin Dashboard (§26) — Recharts charts + org-wide mock attendance
- [DONE] Employee management (§27-30) — CRUD, detail page, import
- [DONE] Corrections (§31) + Org CRUD (§32-34) — corrections + org pages with CRUD
- [DONE] Shifts, Locations, Google Maps, Holidays (§36-39) — full CRUD + map picker
- [DONE] Reports + Import (§40-41) — 6 report types + CSV export + 3-step import wizard
- [DONE] Announcements + Roles & Permissions (§42-43) — RBAC now backend-backed
- [DONE] Backend RBAC module — real `rolePermission` rows, 14-permission catalogue, admin guard
- [DONE] Mock layer removed entirely — real API only
- [DONE] Department removed from FE (Deny-everywhere semantics; `DepartmentsPage` stubbed `return null`) + backend `Designation`/`Team` departmentId optional (migration `department_optional`)
- [DONE] Leave + Correction approval visible to manager AND admin; admin Leave Approvals page (`/leave/approvals`) + Approvals nav group added
- [DONE] Add Employee form: Office before Designation; hidden for admin; Reporting Manager filtered by selected office

## Next Steps
- [x] **Live smoke the forgot-password/OTP flow** — DONE 2026-09-16: existing/non-existing email identical generic response, 429 `RATE_LIMITED` cooldown, `OTP_INVALID` countdown, 5th mismatch `OTP_ATTEMPTS_EXCEEDED`, valid OTP reset → old-password login 401 + pre-reset refresh token revoked, reused OTP rejected, `OTP_EXPIRED` verified (db-rewound expiry). Demo password restored; OTP rows cleaned. Only unverifiable item: real email delivery (no RESEND_API_KEY; dev fallback logs OTP in the BE console window).
- [ ] `OtpInput` "spread error/overflow" formatting edge case — no logic change since each box is one digit, but visually verify the focus ring/paste handling on autofill.
- [ ] Optional: auto-redirect `/forgot-password` success → login (currently a manual "Back to login" button).