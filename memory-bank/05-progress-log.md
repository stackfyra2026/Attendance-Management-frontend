# StaffFlow — Progress Log

## Single Device Login per Day — IMPLEMENTED (2026-09-17)
Backend feature flag (NestJS, see backend repo memory-bank: `DeviceSession` table,
`SINGLE_DEVICE_LOGIN_ENABLED`, `DEVICE_SESSION_TIMEZONE`, `DEVICE_SESSION_BLOCKED` 403).
Frontend changes in this repo:
- [x] `src/services/device.service.ts` (NEW) — `getDeviceId()`: stored UUID via
  `storageGet/storageSet` (`attendflow.device-id`), `crypto.randomUUID()` + fallback generator,
  single-flight (share an in-flight promise, no races); id NEVER cleared by logout. Exports
  `DEVICE_ID_HEADER = "X-Device-Id"`.
- [x] `src/services/http/request.ts` — request interceptor now awaits `session.getAccessToken()`
  and `getDeviceId()` in parallel and sets Authorization + `X-Device-Id` on every request
  (incl. 401-retry path, which re-runs through the interceptor).
- [x] `src/services/http/errors.ts` — `DEVICE_SESSION_BLOCKED` added to `ApiErrorCode` union.
- [x] Verified `npx tsc --noEmit` exit 0; `npm run build` exit 0; `npx cap sync` exit 0.
- [x] Docs: `CAPACITOR_SETUP.md` §11 "Single device login per day"; memory bank updated.
Backend e2e: 6 new tests green. (Note: 4 pre-existing suite failures persist — asserts
`user.availableRoles` which `buildUserBlock` never returns, and shared `dev.db` fixtures — NOT
caused by this feature.)

## Phases 6–13: Capacitor migration COMPLETED (2026-09-17)

> User prompt: "proceed". Completed the remaining phases of the approved 13-phase Capacitor migration (phases 1–5 were logged below). Verified after each phase: `npx tsc --noEmit` exit 0; final `npm run build` exit 0 and `npx cap sync` exit 0.

### Phase 6 — Secure Storage Abstraction
- [x] `src/services/storage/secure-storage.ts` (NEW) — `storageGet/Set/Remove`: native → `@capacitor/preferences` (Preferences.get/set/remove), web → `localStorage` with try/catch guards.
- [x] `src/services/storage/index.ts` (NEW) — barrel.
- [x] `src/services/http/session.ts` — REWRITTEN to async: `getAccessToken/getRefreshToken/getTokens/setTokens/setAccessToken/clear` all return Promises; token keys unchanged (`attendflow.access-token`/`attendflow.refresh-token`).
- [x] `src/services/http/request.ts` — request interceptor now `async` (awaits `getAccessToken`); `doRefresh()` awaits `getTokens()/setTokens()/clear()`; 401-retry path awaits `getAccessToken()`.
- [x] `src/store/slices/authSlice.ts` — `loginUser`, `bootstrapSession` (awaits `getTokens`/`getAccessToken`/`clear`), `logoutUser` (awaits getRefreshToken/clear) all await session.
- [x] Verified `npx tsc --noEmit` exit 0.

### Phase 7 — App Version & Force Update
- [x] `src/services/http/endpoints.ts` — added `API.app.version = "/app/version"`.
- [x] `src/services/native/force-update.ts` (NEW) — `checkForForceUpdate()` (native-only; compares installed version vs backend `{android,ios:{minimumVersion,latestVersion,forceUpdate,storeUrl}}` via `get()`; `compareVersions()`; `openStore()`), `updateInfo` types. Missing endpoint/non-native → skipped silently (no blocking).
- [x] `src/components/native/ForceUpdateScreen.tsx` (NEW) — full-screen block: installed vs latest version rows + Update Now → store.
- [x] `src/components/native/ForceUpdateGate.tsx` (NEW) — mounted in `main.tsx` around `<AppRouter>`; renders the block only when `forceUpdate`.
- [x] Verified `npx tsc --noEmit` exit 0.

### Phase 8 — Android Back Button & Status Bar & Splash
- [x] `src/services/native/back-button.ts` (NEW) — `subscribeBackButton()` (`App.addListener("backButton")`; `canGoBack` → `window.history.back()`, else `window.confirm` → `onExitConfirmed`) + `exitApp()` (`App.exitApp()`). `PluginListenerHandle` imported from `@capacitor/core` (NOT from @capacitor/app).
- [x] `src/hooks/useBackButton.ts` (NEW) — mounts/unmounts listener; exits via `exitApp`.
- [x] `src/components/native/NativeChrome.tsx` (NEW) — mounted once inside `<BrowserRouter>` (AppRouter) before SessionBootstrap: `useBackButton()` + runtime `StatusBar.setBackgroundColor("#00a884")` + `StatusBar.setStyle(Style.Dark)` (v8 exports `Style` enum — string literal `"DARK"` is NOT assignable). Splash screen already config-only (capacitor.config.ts).
- [x] Verified `npx tsc --noEmit` exit 0.

### Phase 9 — Network Handling & Keyboard
- [x] `src/services/native/network.ts` (NEW) — `getConnectivity()` + `subscribeConnectivity()` (native `@capacitor/network`; web fallback `navigator.onLine`); `Connectivity { connected, connectionType }`.
- [x] `src/components/native/OfflineBanner.tsx` (NEW) — sticky top `bg-danger` banner (`safe-area-top`), rendered by NativeChrome on native.
- [x] Keyboard — handled declaratively in `capacitor.config.ts` (`resize: "body"`, `style: "DARK"`); no runtime code.
- [x] Verified `npx tsc --noEmit` exit 0.

### Phase 10 — Deep Linking & Routing
- [x] `src/services/native/deep-link.ts` (NEW) — `parseDeepLink()`, `getLaunchUrl()` (cold start via `App.getLaunchUrl`), `subscribeDeepLinks()` (`App.addListener("appUrlOpen")`).
- [x] `NativeChrome.tsx` — navigates launch/appUrlOpen URLs through React Router (`navigate(path+search)`), still BrowserRouter.
- [x] `android/AndroidManifest.xml` — `android:autoVerify` VIEW intent filter (`https://app.staffflow.com`) + `staffflow://open` custom scheme.
- [x] `ios/Info.plist` — `CFBundleURLTypes` (schema `staffflow`).
- [x] Verified `npx tsc --noEmit` exit 0.

### Phase 11 — Permissions Configuration
- [x] `android/AndroidManifest.xml` — `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `CAMERA`, `POST_NOTIFICATIONS` + non-required `<uses-feature>` camera/gps.
- [x] `ios/Info.plist` — `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSLocationWhenInUseUsageDescription`.
- [x] Verified `npx tsc --noEmit` + `npm run build` + `npx cap sync` exit 0.

### Phase 12 — Build Scripts, .env.example, CAPACITOR_SETUP.md
- [x] `package.json` — added `cap:sync`, `cap:android`, `cap:ios`, `cap:run:android`, `cap:run:ios`, `cap:doctor`.
- [x] `.env.example` (NEW) — VITE_APP_NAME, VITE_API_BASE_URL, VITE_GOOGLE_MAPS_API_KEY, VITE_FIREBASE_* (existing `.env` keys).
- [x] `CAPACITOR_SETUP.md` (NEW) — full ops guide: prerequisites, daily workflow, capacitor.config mapping, FCM/APNs push setup, camera/gallery/location strings + manifest permissions, branding via `@capacitor/assets`, deep-linking (custom scheme + App Links + Universal Links), force-update endpoint contract, release gotchas.
- [x] `src/services/native/index.ts` (NEW) — final barrel (platform/version/camera/location/notifications/force-update/back-button/network/deep-link).

### Phase 13 — Memory Bank
- [x] Updated `02-active-context.md` (current focus → migration COMPLETE, phase summaries), `04-tech-context.md` (native modules row), `05-progress-log.md`.

### Notes
- `@capacitor/core` exports `PluginListenerHandle`; plugin-specific packages DO NOT — import it from `@capacitor/core`.
- `@capacitor/status-bar` v8 exports `Style` enum (`Style.Dark`); plain string causes `TS2322`.
- android/ios native edits (manifest, Info.plist) are LOCAL ONLY (folders git-ignored); regeneration after `npx cap add` on a fresh clone requires re-applying them — documented in CAPACITOR_SETUP.md.

## Phase 2: Platform Detection & Native Service Abstractions — COMPLETE (2026-09-17)

### Completed (2026-09-17)
- [x] `src/services/native/platform.ts` (NEW) — `isNativePlatform()`, `isAndroid()`, `isIOS()`, `isWeb()`, `getPlatform()`, `NativePlatform` type via `@capacitor/core` `Capacitor` API (not UA sniffing).
- [x] `src/services/native/version.ts` (NEW) — `getAppVersion()` → `AppVersionInfo { version, build, platform, isNative }`; native via `App.getInfo()` (versionName + versionCode on Android, CFBundleShortVersionString + CFBundleVersion on iOS), web fallback to `config.version`.
- [x] Verified `npx tsc --noEmit` exit 0.

### Notes
- `build` in `AppInfo` is a **string** (versionCode/CFBundleVersion) — typed as `string | null`.
- Barrel `src/services/native/index.ts` deferred until all native service modules exist (Phase 7) to avoid dangling imports.

## Phase 5: Push Notifications Native Plugin — COMPLETE (2026-09-17)

### Completed (2026-09-17)
- [x] `src/services/native/notifications.ts` (NEW) — `registerForNativePush()` (requestPermissions → `PushNotifications.register()` + single-flight; returns `{status:'ready',token}|denied|error|unsupported`), `onNativePushMessage()` (`pushNotificationReceived`), `onNativePushActionPerformed()` (`pushNotificationActionPerformed`), `unregisterNativePush()`, `shouldUseNativePush()`. Maps Capacitor `PushNotificationSchema` → app `Notification` (data `{id,type,link,createdAt}`).
- [x] `src/services/fcm/useFcmPush.tsx` — `FcmPushProvider` branches: native → `registerForNativePush()` → register token with backend (`notificationService.registerDeviceToken(token, platform)` with platform `android`/`ios`) → wire native message + action listeners → `dispatch(addNotification)`; tap with `link` navigates via `window.location.href`. Web path (Firebase gate + `fcmService.init()` + `onMessage`) unchanged.
- [x] Verified `npx tsc --noEmit` exit 0 (v8 API: event names `pushNotificationReceived`/`pushNotificationActionPerformed`, `PluginListenerHandle` from `@capacitor/core`).

### Notes
- Android native push requires `google-services.json` (FCM) placed in `android/app/` (Phase 11/12 doc); without it `register()` resolves `error` gracefully.
- iOS native push requires APNs entitlement in Xcode (Capability); documented in CAPACITOR_SETUP.md.
- Web FCM service worker remains the web path; no changes to `fcm.service.ts` (web-only).

## Phase 4: Camera Native Plugin — COMPLETE (2026-09-17)

### Completed (2026-09-17)
- [x] `src/services/native/camera.ts` (NEW) — reusable abstractions: `takePicture()` (native `Camera.takePhoto`, web `<input type=file>`), `pickFromGallery()` (native `Camera.chooseFromGallery` w/ `MediaTypeSelection.Photo`, web file input), `pickPhotoFromGallery()`, `mediaToFormData()`. Returns `PickedMedia { file, webPath, mimeType, format }`; `CameraPickError { reason: denied|cancelled|unavailable|error }`. Native media resolved via `fetch(uri|webPath)` → Blob → `File`; thumbnail fallback.
- [x] `src/components/ui/ImagePicker.tsx` (NEW) — reusable photo picker: preview (with remove), Camera + Gallery buttons, loading state, toast per `CameraPickError`. Uses app Button + useToast design system.
- [x] Verified `npx tsc --noEmit` exit 0 (fixed `MediaTypeSelection` import).

### Notes
- App has NO existing camera/upload UI (profile photo / leave attachments not yet wired) — abstraction is ready for future consumers; CSV import (existing upload) untouched.
- Camera v8 API: `takePhoto`/`chooseFromGallery` native-first; deprecated `getPhoto` avoided.

## Phase 3: Geolocation Native Plugin — COMPLETE (2026-09-17)

### Completed (2026-09-17)
- [x] `src/services/native/location.ts` (NEW) — `GeolocationResult` (moved here to avoid FE type circular import with `location.service.ts`), `getCurrentNativePosition()` (check → request → get via `@capacitor/geolocation`; `enableHighAccuracy`/`timeout`/`maximumAge` from `config.location`), `checkLocationPermissions()`, `requestLocationPermissions()`, `LocationPermState`/`LocationPermissionState` (maps `prompt-with-rationale` → `prompt`). `NativeLocationError` w/ `LocationStatus`; denied → `PERMISSION_DENIED`, other failures → `UNAVAILABLE`.
- [x] `src/services/location.service.ts` — `getCurrentPosition()` branches: native → `getCurrentNativePosition()` (maps `NativeLocationError` → `LocationApiError`), web → existing `navigator.geolocation` path unchanged. Re-exports `GeolocationResult`. Callers (`LocationVerification`, `CheckOutSheet`, attendance slice) untouched.
- [x] Verified `npx tsc --noEmit` exit 0 (fixed `PermissionStatus` coarseLocation/prompt-with-rationale typing).

---

## Phase 1: Capacitor Install & Configure — COMPLETE (2026-09-17)

> User prompt: convert React.js app to Capacitor mobile app (Android + iOS). Phase plan approved — 13 phases; memory bank updated after each. Verified: `npm run build` exit 0, `npx cap sync` exit 0, both platforms added.

### Completed (2026-09-17)
- [x] Installed `@capacitor/core@8.x`, `@capacitor/cli@8.x` (dev), `@capacitor/android@8.x`, `@capacitor/ios@8.x`, plus plugins: `@capacitor/camera`, `@capacitor/geolocation`, `@capacitor/push-notifications`, `@capacitor/preferences`, `@capacitor/network`, `@capacitor/app`, `@capacitor/keyboard`, `@capacitor/status-bar`, `@capacitor/splash-screen`.
- [x] `capacitor.config.ts` (NEW) — `appId: com.webetechies.staffflow`, `appName: StaffFlow`, `webDir: dist`, `server.androidScheme: "https"` (CORS-safe on Android), plugin configs: SplashScreen (#00a884, 2s, CENTER_CROP, fullscreen, immersive), StatusBar (DARK, #00a884, overlaysWebView), Keyboard (resize: body, DARK).
- [x] `npx cap add android` → `android/` project (9 plugins registered).
- [x] `npx cap add ios` → `ios/` project (9 plugins registered, Package.swift written).
- [x] `.gitignore` — added `android/`, `ios/`, `.capacitor/`; added `!.env.example` exception.
- [x] `npm run build` exit 0 (tsc + vite; pre-existing chunk-size warning only).
- [x] `npx cap sync` exit 0 (web assets copied to both platforms).

### Notes
- `dist/` is the web build dir (Vite default); `androidScheme: "https"` keeps the WebView origin CORS-compatible.
- iOS/CocoaPods + Android Studio not opened (Windows dev machine; `npx cap open` is a macOS/Xcode + Android Studio step, documented in CAPACITOR_SETUP.md Phase 12).
- PWA service worker still registers in WebView too — reviewed; Firebake FCM SW is required for web push; SW registration in Capacitor is harmless (file/http origin), will gate on native in Phase 5.

---

## Session 2026-09-17: Demo login restore (rahul@attendflow.in) — COMPLETE

> User prompt: demo account login getting "Invalid email or password". Root cause: frontend quick-demo pre-fills `rahul@attendflow.in` (LoginPage.tsx:12), but that user was gone — backend re-seed now emits 60 employees as `emp001@attendflow.in`–`emp060@attendflow.in` and Rahul only existed as `emp001@attendflow.in`. Verified against live API: `rahul@attendflow.in`/`password` → 401 `INVALID_CREDENTIALS`.

### Completed (2026-09-17)
- [x] Backend `prisma/seed.ts:373` — `email = empIndex === 0 ? 'rahul@attendflow.in' : \`emp${pad(empIndex + 1, 3)}@attendflow.in\`` (index 0 = "Rahul Sharma"), so `db:reset` reproduces the demo employee account.
- [x] Live DB patched via `prisma db execute` (no reset): `User.email` + `Employee.businessEmail`/`loginEmail` for EMP1001 → `rahul@attendflow.in`.
- [x] Backend `npm run build` clean.
- [x] Live smoke: all 3 demo accounts log in with password `password` → Rahul Sharma [EMPLOYEE], Priya Patel [MANAGER], Vikram Mehta [ADMIN].

---

## Session 2026-09-16: PWA Implementation (installable + offline shell + merged FCM push SW) — COMPLETE

> User prompt: "i want to create this web app as PWA". Choice: Full PWA + merge FCM into a single service worker; app name **StaffFlow**. Verified: `npx tsc --noEmit` (via `npm run build`) exit 0 + `npm run build` success + preview smoke (manifest 200, `/firebase-messaging-sw.js` 200 with `importScripts` + FCM logic, `/` 200).

### Completed (2026-09-16)
- [x] `npm i -D vite-plugin-pwa@1.3.0 @vite-pwa/assets-generator`; generated PWA icons from `public/logo.svg` (`pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico`).
- [x] `vite.config.ts` — `VitePWA({ strategies: 'injectManifest', srcDir: 'src', filename: 'firebase-messaging-sw.ts', injectRegister: false, registerType: 'autoUpdate', injectManifest.globPatterns, manifest: StaffFlow with #00a884 theme/background, 4 icons })`.
- [x] `src/firebase-messaging-sw.ts` (NEW) — merged SW: Workbox `precacheAndRoute(self.__WB_MANIFEST)` + `cleanupOutdatedCaches` + `skipWaiting()`/`clients.claim()` + SPA `NavigationRoute`→`index.html` (denylist `/api/`, `/_`, file-ext URLS) + FCM background messaging (importScripts compat 10.14.1, `?config=` param, notificationclick→navigate).
- [x] Deleted `public/firebase-messaging-sw.js` (built SW now produces `dist/firebase-messaging-sw.js`; FCM still registers the same `/firebase-messaging-sw.js?config=…` URL — no scope conflict, no double SW).
- [x] `src/services/fcm/fcm.service.ts` — added `ensurePwaSw()`/`ensureServiceWorker()` (deduped, registers SW regardless of push permission/config); `init()` reuses it for `getToken`.
- [x] `src/main.tsx` — registers the PWA SW on `window.load` via `ensurePwaSw()` (independent of login state).
- [x] `index.html` — apple-touch-icon link, `mobile-web-app-capable` + `apple-mobile-web-app-title` (StaffFlow), `theme-color` `#4F46E5` → `#00a884` (app primary), favicon.ico link. Manifest link auto-injected by plugin at build.
- [x] Verified: build exits 0 (fixed injected-SW TS conflict — Workbox v7 types already declare `__WB_MANIFEST`); preview server serves `manifest.webmanifest`, `firebase-messaging-sw.js` (self-contained classic script, no ESM `import`/`export` → `importScripts` valid), and app root all 200.

---

## Session 2026-09-16: StaffFlow Branding & Custom Date/Time/Select Controls Upgrade — COMPLETE

> User prompt: "Rename AttendanceManagement -> StaffFlow; Native Date Input -> Date Picker; Native Time Input -> Time Picker; Native Select -> Reusable Select Component." Verified: `npx tsc --noEmit` and `npm run build` both exit 0 cleanly.

### Completed (2026-09-16)
- [x] Application Renamed to **StaffFlow**: `package.json` (`"staff-flow"`), `src/config/index.ts` (`"StaffFlow"`), `index.html` (`<title>StaffFlow</title>`), `LoginPage.tsx` & `EmployeeFormPage.tsx` demo emails & placeholders (`@staffflow.in`).
- [x] Custom DatePicker Upgrade (`src/components/ui/DatePicker.tsx`): Replaced native `<input type="date">` with a custom calendar popover component supporting month/year navigation, min/max date validation, clear button, keyboard accessibility, and `React Hook Form` integration returning `YYYY-MM-DD` ISO string.
- [x] Custom TimePicker Upgrade (`src/components/ui/TimePicker.tsx`): Replaced native `<input type="time">` with a custom time selector popover supporting hour (01-12), minute (00-55), AM/PM toggle, quick time presets, keyboard accessibility, and `React Hook Form` integration returning `HH:mm` 24-hour string.
- [x] Custom Select Upgrade (`src/components/ui/Select.tsx`): Replaced native HTML `<select>` with a custom accessible dropdown popover supporting option search filtering (when > 6 options), checkmark indicators, keyboard navigation, and `React Hook Form` compatibility.
- [x] Verified: `npx tsc --noEmit` + `npm run build` exit 0 cleanly.

---

## Session 2026-09-16: SaaS UI/UX Polish & Standardisation — COMPLETE

> User prompt: "improve and polish the existing UI without changing the existing page layout, page width, structure, or functionality." Verified: `npx tsc --noEmit` and `npm run build` both exit 0 cleanly.

### Completed (2026-09-16)
- [x] `src/index.css` — refined `:root` and `.dark` CSS tokens for surface backgrounds (`--surface`, `--surface-muted`), text hierarchy (`--text`, `--text-muted`), crisp borders (`--border`), focus rings, and scrollbars.
- [x] `src/components/ui/Button.tsx` — standardized variant styles (`primary`, `secondary`, `outline`, `ghost`, `danger`, `success`), focus rings (`focus:ring-2 focus:ring-primary/30`), active press scale feedback (`active:scale-[0.98]`), and consistent min-heights.
- [x] `src/components/ui/Card.tsx` & `StatCard.tsx` — updated with modern border styling (`border-app/80`), subtle shadow (`shadow-xs`), clear uppercase tracking-wider text titles, and crisp icon container badges.
- [x] `src/components/ui/Input.tsx`, `Select.tsx`, `DatePicker.tsx`, `TimePicker.tsx`, `Textarea.tsx` — standardized input height (`min-h-[42px]`), border hover/focus states, placeholder text styling, and clear error label presentation.
- [x] `src/components/ui/DataTable.tsx` — polished table header styling (`bg-surface-muted/50`), uppercase tracking-wider title font, crisp row dividers (`divide-app/60`), and subtle row hover highlights.
- [x] `src/components/ui/Badge.tsx` — pill design (`rounded-full`), soft tint backgrounds with matching border rings, and clean status indicators.
- [x] `src/components/ui/Modal.tsx` & `Dropdown.tsx` — smooth dark backdrop blur overlay (`bg-slate-900/60 backdrop-blur-xs`), header title divider, and elevated card shadows (`shadow-2xl` / `shadow-lg`).
- [x] `src/components/ui/Tabs.tsx` & `EmptyState.tsx` — active tab underline indicator, pill count badges, and structured empty/error state icons.
- [x] `src/components/layout/AdminSidebar.tsx` & `ManagerSidebar.tsx` — exact width `w-64` / `w-20` preserved; active navigation link tint (`bg-primary-50/70 dark:bg-primary-950/40 text-primary font-bold`); sub-menu vertical line indicator guide (`border-l border-app/60 pl-3 ml-5`).
- [x] `src/components/layout/TopBar.tsx` — exact height `h-16` preserved; refined user profile dropdown button, notification bell badge alignment, and sticky backdrop blur header styling.
- [x] Verified: `npx tsc --noEmit` + `npm run build` exit 0 cleanly.

---

## Session 2026-09-16: Remove Location Accuracy Gate (Circle-Only Check-In) — COMPLETE

> User: "no need check location accuracy only check current lat long has or not company lat long in circle area". Verified: `npx tsc --noEmit` exit 0.

### Completed (2026-09-16)
- [x] `src/components/location/LocationVerification.tsx` — removed accuracy gate (`isLowAccuracyAccuracy` check + LOW_ACCURACY early return); `verify()` now goes straight to `calculateDistance` → `distance <= office.radiusMeters`. Removed SatelliteDish import, LOW_ACCURACY entry from StatusIcon map, LOW_ACCURACY render block, statusTitle/defaultMessage LOW_ACCURACY cases.
- [x] `src/types/enums.ts` — removed `LocationStatus.LOW_ACCURACY` (all Record<LocationStatus,...> maps now valid).
- [x] `src/services/location.service.ts` — removed dead `isLowAccuracyAccuracy()`.
- [x] `src/config/index.ts` — removed unused `location.maxAccuracyMeters` (interface + value); `highAccuracy`/`timeoutMs` retained.
- [x] `CheckOutSheet.tsx` — already circle-only, no changes needed.
- [x] Verified: `npx tsc --noEmit` exit 0; location check-in now succeeds purely when user is inside the office geofence radius.

---

## Phase 1: Foundation + Application Shell — COMPLETE (2026-09-11)

> Verified: `npx tsc --noEmit` exits 0 (clean). Memory bank aligned to full 67-section spec.
>

### Completed (2026-09-11)

**Project Scaffolding**
- [x] Vite + React 19 + TypeScript project created
- [x] All npm dependencies installed
- [x] Path aliases configured (`@/` → `src/`)
- [x] `.env` and `.env.example` created
- [x] PWA meta tags in `index.html`

**Design System**
- [x] Tailwind CSS v4 with `@theme` configuration
- [x] CSS variables for all semantic tokens (primary, secondary, success, warning, danger, surface, text, border)
- [x] Light + dark mode CSS variables
- [x] Custom utility classes (`bg-app`, `text-app`, `border-app`, etc.)
- [x] Inter font loaded from Google Fonts
- [x] Safe-area padding for mobile

**UI Components (23 components)**
- [x] Button, IconButton
- [x] Input, Select, Textarea, DatePicker, TimePicker
- [x] Avatar, Badge, Card
- [x] Modal, BottomSheet, Drawer, Dropdown
- [x] Tabs, Toast (with context provider), ConfirmDialog
- [x] DataTable, Pagination
- [x] Skeleton, EmptyState, ErrorState
- [x] StatCard

**Type System**
- [x] All TypeScript interfaces: User, Employee, Department, Designation, Team, OfficeLocation, Shift, Attendance, Leave, Holiday, Notification, Announcement, etc.
- [x] Enums: Role, AttendanceStatus, LeaveStatus, LeaveType, EmploymentType, etc.
- [x] Constants with labels for all enum values

**Utilities**
- [x] `distance.ts` — Haversine distance calculation, formatDistance, isWithinRadius
- [x] `date.ts` — All date-fns re-exports + custom formatters (formatTime, formatDate, getGreeting, etc.)
- [x] `helpers.ts` — classNames, getInitials, generateId, formatNumber, downloadCSV, etc.

**Redux Store**
- [x] Store configured with auth, app, notification slices
- [x] `authSlice` — login/logout/switchRole with mock demo users
- [x] `appSlice` — theme toggle, sidebar state, dark mode persistence
- [x] `notificationSlice` — fetch, markAsRead, markAllAsRead
- [x] Custom hooks: `useAppSelector`, `useAppDispatch`

**Routing**
- [x] All routes defined in AppRouter
- [x] ProtectedRoute component
- [x] RoleRoute component (role-based access)
- [x] Employee routes: /dashboard, /attendance, /attendance/monthly, /leave, /leave/apply, /notifications, /profile
- [x] Admin routes: /admin/dashboard, /employees, /departments, /designations, /teams, /shifts, /locations, /holidays, /reports, /announcements, /settings
- [x] Auth routes: /login, /forgot-password

**Layouts**
- [x] EmployeeLayout — compact header + bottom nav + safe-area
- [x] AdminLayout — sidebar + mobile hamburger + top bar
- [x] AdminSidebar — collapsible navigation groups
- [x] TopBar — theme toggle, notifications, user dropdown

**Pages (All scaffolded with content)**
- [x] LoginPage — demo role switcher, show/hide password, validation
- [x] ForgotPasswordPage — email form + success state
- [x] EmployeeDashboard — greeting, attendance card, summary stats
- [x] AttendancePage — summary stats, tabs, attendance list
- [x] MonthlyAttendancePage — calendar grid with status colors
- [x] LeavePage — balance cards, history list
- [x] ApplyLeavePage — form with Zod validation
- [x] NotificationsPage — read/unread, mark all
- [x] ProfilePage — personal info, employment info
- [x] AdminDashboardPage — stat cards, chart placeholders, recent activity
- [x] EmployeesPage — search, table (desktop), cards (mobile)
- [x] DepartmentsPage — department cards
- [x] DesignationsPage — designation cards
- [x] TeamsPage — team cards with attendance
- [x] ShiftsPage — shift cards
- [x] LocationsPage — office location cards with coordinates
- [x] HolidaysPage — holiday list with type badges
- [x] ReportsPage — report types, filters, export buttons
- [x] AnnouncementsPage — announcement list
- [x] SettingsPage — roles, permissions matrix

**Mock Data**
- [x] Notifications mock data (10 items)

**Phase 1 Cleanup**
- [x] Fix TypeScript error in `Input.tsx:35` → `!!leftIcon && "pl-10"`
- [x] Fix TypeScript error in `AttendancePage.tsx:32` → `const [_activeTab, setActiveTab]`
- [x] `npx tsc --noEmit` verified clean (exit 0)

---

## Phase 2: Check-in/Out Flow + Location Services — COMPLETE (2026-09-11)

> Verified: `npx tsc --noEmit` exit 0 and `npm run build` success (after one unused-import fix in CheckOutSheet).

### Completed (2026-09-11)

**Mock Data Layer (§46)**
- [x] `src/mocks/data/departments.ts` (5), `designations.ts` (9), `teams.ts` (5)
- [x] `shifts.ts` (2), `offices.ts` (3 offices: Delhi CP, Mumbai BKC, Bangalore; radiusMeters from config)
- [x] `employees.ts` — **33 employees** linked to depts/designations/teams/shifts/offices
- [x] `holidays.ts` (8 Indian holidays), `announcements.ts` (3 active), `attendance.ts` (14-day history CrossRef emp1), `index.ts` barrel

**Services (flat, D8)**
- [x] `location.service.ts` — geolocation wrapper, `LocationApiError`, `isLowAccuracyAccuracy`
- [x] `location-office.service.ts` — `getAll`, `getById`
- [x] `employee.service.ts` — `getById`, `getByEmployeeId`, `getByLoginEmail`
- [x] `attendance.service.ts` — `checkIn` (radius validation, localStorage `attendflow.active-attendance`), `checkOut`, `endBreak`, `getToday`, `getHistory`
- [x] `shift.service.ts` — `getById`; `announcement.service.ts` — `getActive`

**Redux + Hooks**
- [x] `attendanceSlice` with thunks (fetchTodayAttendance, fetchAttendanceHistory, checkIn, checkOut, endBreak) + reducers (startBreak, clearToday, clearError); registered in `store.ts`
- [x] `src/hooks/useNow.ts` (1s tick; D13 timers from timestamps, no Redux ticks)

**Components**
- [x] `LocationVerification` — 7 states (§17); verified/outside vs assigned office radius; **Continue passes captured position** (zero-coords placeholder bug fixed)
- [x] `AttendanceCard`, `AttendanceStatusBadge`, `WorkingTimer`, `BreakTimer`, `CheckInFlow`, `CheckOutSheet`

**Integration**
- [x] Employee Dashboard (§13): fetch employee/office/shift/announcements via services; loading skeleton; check-in/out toasts; live Working + Break timers; announcements card

**Docs**
- [x] FEATURES.md updated (§59) — check-in/out, location, timers marked complete

### Known Notes
- Vite build warns about chunk size >500 kB and `vite.config.ts:10 __dirname` (configLoader native) — informational only

---

## Phase 3: Attendance History + Monthly Calendar — COMPLETE (2026-09-11)

> Verified: `npx tsc --noEmit` exit 0 and `npm run build` success.

### Completed (2026-09-11)
- [x] `attendance.service.getMonthly(employeeId, month)` — merges history + live active record + `mockHolidays` + Sunday week-offs into `{ days: Record<date, Attendance|undefined>, summary }` with `EMPTY_SUMMARY` constant
- [x] `attendanceSlice` — `monthly` + `isLoadingMonthly` state; `fetchMonthlyAttendance({ employeeId, month })` thunk
- [x] `useEmployee` hook (`src/hooks/useEmployee.ts`) — resolves `user.employeeId` → `Employee` via `employeeService`; shared by Dashboard, AttendancePage, MonthlyAttendancePage
- [x] `AttendancePage` rewrite (§21) — Today/This Week/This Month tabs from store history, per-range stat cards, live today merged/deduped, `AttendanceStatusBadge`, loading skeleton + `EmptyState` (replaces inline placeholder data)
- [x] `MonthlyAttendancePage` rewrite (§22) — real calendar (Monday-start leading blanks, today ring), 6-stat summary, status legend, loading + empty states
- [x] Dashboard refactored to use `useEmployee` (removed duplicate employee fetch + unused `user`-driven load)

---

## Phase 4: Leave Management — COMPLETE (2026-09-11)

> Verified: `npx tsc --noEmit` exit 0 and `npm run build` success.

### Completed (2026-09-11)
- [x] `src/mocks/data/leaves.ts` — `buildLeaveRequests()`: emp1 approved casual/sick history, rejected (with reason), pending future
- [x] `src/services/leave.service.ts` — `getBalance`, `getHistory`, `apply`, `cancel`, `approve`, `reject` (approve/reject consumed in admin phase)
  - Balance derived live from requests; totals in service config (Casual 12 / Sick 10 / Earned 15)
  - `apply` validates: end ≥ start (weekday count via `differenceInBusinessDays`), overlap with approved/pending, sufficient balance (unpaid exempt)
- [x] `src/store/slices/leaveSlice.ts` + registered in `store.ts` — `balance`, `history`, `isLoading`, `error`; thunks `fetchLeaveBalance`, `fetchLeaveHistory`, `applyLeave`, `cancelLeave`
- [x] `src/components/leave/LeaveStatusBadge.tsx` — icon + text + color status pill
- [x] `LeavePage` — real balance bars (used/pending/remaining), history with badges, cancel (ConfirmDialog) on pending, pending-count tab label, loading skeleton + empty state
- [x] `ApplyLeavePage` — `applyLeave` thunk; success toast + redirect, error toasts (overlap / insufficient balance)
- [x] FEATURES.md + memory bank (02/05/07) updated

---

## Phase 5: Profile + Notifications — COMPLETE (2026-09-11)

> Verified: `npx tsc --noEmit` exit 0 and `npm run build` success.

### Completed (2026-09-11)
- [x] `src/services/notification.service.ts` — `getAll`, `markAsRead`, `markAllAsRead`, `getUnreadCount` (in-memory)
- [x] `notificationSlice` — `fetchNotifications`/`markAsRead`/`markAllAsRead` now service-backed thunks (used to be pure reducers reading `mockNotifications` directly; `fetchNotifications` was never dispatched before — notifications never loaded)
- [x] `EmployeeLayout` + `TopBar` dispatch `fetchNotifications()` on mount (unread badges populate app-wide; TopBar badge added for admin)
- [x] `NotificationsPage` — loading skeleton, tap-to-mark-single-read, type label chip, mark-all-read, empty state
- [x] `employee.service.getProfile(employeeId)` — populates department/designation/office/shift/manager relations
- [x] `ProfilePage` — personal + employment + emergency-contact sections from real data (formatted dates, gender/employment labels), loading skeleton
- [x] FEATURES.md + memory bank (02/05/06/07) updated

---

## Phase 6: Admin Dashboard — COMPLETE (2026-09-11)

> Verified: `npx tsc --noEmit` exit 0 and `npm run build` success.

### Completed (2026-09-11)
- [x] `src/utils/helpers.ts` — `themeColor(cssVar)` reads computed CSS custom props (space-separated RGB triplets) → `rgb(...)` strings for Recharts fills/strokes (theme-aware, no hardcoded colors)
- [x] `src/mocks/data/dashboard.ts` — `buildOrgAttendance(days)` deterministic seeded org-wide attendance (all 33 employees × 14 days incl. today; Sundays omitted; ~6% leave / 8% absent / 12% late / rest present with derived check-in/out times; status seeded by `employeeId-date` hash)
- [x] `src/services/dashboard.service.ts` — `getOverview`, `getAttendanceTrend(days)`, `getDepartmentStats`, `getRecentCheckIns(limit)` (mock-delayed; no Redux needed)
- [x] `AdminDashboardPage` rewrite — 6 StatCards (total/present/absent/late/on-leave/attendance % + trend delta), Recharts AreaChart (14-day present/absent gradient areas), stacked BarChart (department present/late/absent), Recent Check-ins reusing `AttendanceStatusBadge`, loading skeletons + retry error state (replaces hardcoded 248-employee stats + chart placeholders)
- [x] FEATURES.md + memory bank (02/05) updated

---

## Phase 7: Employee CRUD — COMPLETE (2026-09-11)

> Verified: `npx tsc --noEmit` exit 0 and `npm run build` success.

### Completed (2026-09-11)
- [x] `employee.service.ts` CRUD — `getAll(filters)` (search/department/employmentStatus, pagination, name sort, populated relations), `create` (unique email check, auto `EMP####` via `nextEmployeeId`), `update` (partial, unique-email), `setActive`; all lookup methods now return populated relations; in-memory store seeded from `mockEmployees`
- [x] `department.service.ts`, `designation.service.ts` (`getAll`); `shift.service.ts` + `getAll` — reference lists for the employee form
- [x] `src/types/index.ts` — `EmployeeFormData` interface added
- [x] `EmployeesPage` rewrite — search + department/status filters (reset to page 1), desktop table + mobile cards, view/edit/activate-deactivate actions, `ConfirmDialog` toggle, `Pagination`, `SkeletonTable`/empty/`ErrorState`-retry states
- [x] `EmployeeFormPage` (`/employees/new`, `/employees/:id/edit`) — RHF + Zod 11-field form (personal/employment/role/account), options via services, manager picker, duplicate-email error toast
- [x] `EmployeeDetailPage` (`/employees/:id`) — Overview/Attendance/Leave tabs (`getMonthly` summary + recent days, `getBalance` bars + history)
- [x] Routes wired; FEATURES.md + memory bank (02/05/06/07) updated

---

## Phase 8: Corrections + Org CRUD — COMPLETE (2026-09-11)

> Verified: `npx tsc --noEmit` exit 0 and `npm run build` success.

### Completed (2026-09-11)
- [x] `department.service.ts` — in-memory CRUD: `getAll` (live employee count from `mockEmployees`, populated manager), `create`/`update` (unique name), `setActive`
- [x] `designation.service.ts` — CRUD: `getAll` (populated department), `create`/`update`, `setActive`
- [x] `team.service.ts` (new) — `getAll`/`getById`, `create`, `updateManager`, `addMembers`, `removeMember` (all populated)
- [x] `attendance.service.ts` — corrections engine: `getCorrectionRecords`, `requestCorrection`, `getCorrections`, `approveCorrection` (applies changes), `rejectCorrection`
- [x] `src/types/index.ts` — `CorrectionRequest`
- [x] `DepartmentsPage` / `DesignationsPage` / `TeamsPage` rewrites — CRUD modals (RHF), activate/deactivate, team member management
- [x] `CorrectionsPage` (`/attendance/corrections`) — Pending/History tabs, review approve/reject, new-correction modal with record lookup
- [x] Routes wired; FEATURES.md + memory bank (02/05/06/07) updated

---

## Phase 9: Shifts, Locations, Google Maps, Holidays — COMPLETE (2026-09-11)

> Verified: `npx tsc --noEmit` exit 0 and `npm run build` success.

### Completed (2026-09-11)
- [x] Installed `@react-google-maps/api` v2.20.8
- [x] `src/components/maps/GoogleMap.tsx` — isolated map w/ marker + geofence circle (themeColor), click-to-select, clean fallback when no API key (`VITE_GOOGLE_MAPS_API_KEY`)
- [x] `shift.service.ts` — CRUD + time helpers (overnight-aware duration, 12h clock)
- [x] `location-office.service.ts` — CRUD (radius ≥ 50m, unique name, default Asia/Kolkata timezone)
- [x] `holiday.service.ts` (new) — getAll/create/update/remove (date-sorted)
- [x] Types: `ShiftFormData`, `OfficeFormData`, `HolidayFormData`
- [x] `ShiftsPage` — cards + CRUD modal + enable/disable
- [x] `LocationsPage` — cards + CRUD modal with embedded map picker + enable/disable
- [x] `HolidaysPage` — list + CRUD modal (recurring toggle) + delete via ConfirmDialog
- [x] FEATURES.md + memory bank (02/05/06/07) updated

---

## Phase 10: Reports + Employee Data Import — COMPLETE (2026-09-11)

> Verified: `npx tsc --noEmit` exit 0 and `npm run build` success.

### Completed (2026-09-11)
- [x] `report.service.ts` — attendance/monthly/late/absent/leave/overtime + `exportCsv` (45-day org records via `buildOrgAttendance`)
- [x] `leave.service.ts` — `getAll()`
- [x] `employee.service.ts` — `importCsv(ImportRow[])` w/ batch + store duplicate checks
- [x] `src/types/index.ts` — `ImportRow`
- [x] `ReportsPage` — 6 tabs, date/month + department/employee/status filters, summary stat cards, responsive table, CSV export (Excel still planned)
- [x] `ImportPage` (`/employees/import`) — 3-step wizard: upload/drag-drop + CSV template, parse + row-level validation (name→id resolution, dup email/ID, role/date checks), valid preview, import with skipped-row summary
- [x] Routes wired; FEATURES.md + memory bank (02/05/06/07) updated

### Post-Phase Fixes (2026-09-11)
- [x] `ReportsPage` — CSV export crash fix: `csvRows` mapper only date-formats strings that are real datetimes (`value.includes("T")` AND `!Number.isNaN(new Date(value).getTime())`)
- [x] `report.service.ts` + `ReportsPage` — Office support added: `ReportFilter.officeId`, `office` field on all report row types, `sameOffice` filter, Office column on every report tab + Office Select in monthly and range filter blocks

---

## Phase 11: Announcements CRUD + Roles & Permissions — COMPLETE (2026-09-11)

> Verified: `npx tsc --noEmit` exit 0 and `npm run build` success.

### Completed (2026-09-11)
- [x] `src/mocks/data/permissions.ts` — `mockPermissions` (14 permissions across 6 modules), `mockRoles` (Admin/Manager/Employee using `Role_` type), `defaultPermissionsByRole`
- [x] `src/services/permission.service.ts` — `getPermissions`/`getRoles`/`updateRolePermissions` (async) + sync `hasPermission` (Admin always true, in-memory editable store)
- [x] `src/hooks/usePermission.ts` — sync hook from `useAppSelector(s.auth.user.role)`, defaults to `Role.EMPLOYEE`
- [x] `src/pages/admin/RolesPage` (`/settings/roles`) — role summary cards (access level badge) + full permission matrix table (grouped by module, admin column read-only, toggle-all-per-module, save flow)
- [x] `src/pages/admin/PermissionsPage` (`/settings/permissions`) — read-only catalogue grouped by module with permission IDs
- [x] `src/pages/admin/SettingsPage` — simplified hub linking to /settings/roles, /settings/permissions, /announcements, /teams
- [x] `announcement.service.ts` — `getAll` (date-sorted), `create`, `update`, `remove`, `getActive` (filters today ∈ [startDate, endDate])
- [x] `src/types/index.ts` — `AnnouncementFormData`
- [x] `AnnouncementsPage` rewrite — RHF+Zod modal (title/description/priority/date range with endDate ≥ startDate refine), live/expired/upcoming badge, edit/delete with `ConfirmDialog`, `usePermission("announcements.manage")` gating
- [x] `EmployeesPage` — `usePermission("employees.create"/"employees.edit"/"employees.deactivate")` gating on Add/Edit/Deactivate buttons (desktop + mobile)
- [x] `ReportsPage` — `usePermission("reports.export")` gating on CSV Export button
- [x] Routes wired `/settings/roles`, `/settings/permissions`; FEATURES.md + memory bank (02/05/06) updated

---

## Phase 11.1: HR Role Removal + Demo QA Setup — COMPLETE (2026-09-11)

> Verified: `npx tsc --noEmit` exit 0 and `npm run build` success.

### Completed (2026-09-11)
- [x] `Role.HR` deleted from `src/types/enums.ts`; `ROLE_LABELS`, `authSlice` demo users, `permission.service` defaults, `permissions.ts` mock roles, `RolesPage` matrix/access levels, `ImportPage` accepted roles all cleaned of HR
- [x] HR content removed — `Human Resources` department (dep2), `HR Manager`/`HR Executive` designations (des5/des6), `People Ops Team` (team4); announcement #3 no longer references HR
- [x] Employees reassigned (all references stay valid): Anita emp3 → Marketing/Manager (team5, mgr emp30), Vikram emp4 (Admin demo) → Finance/Accountant (mgr emp28), Rakesh emp13 → Sales (mgr emp25), Ritika emp18 → Finance (mgr emp28); dept `employeeCount`s updated (dep1=12, dep3=6, dep4=7, dep5=6)
- [x] Demo logins now 3 roles — Employee (Rahul), Manager (Priya), Admin (Vikram), password `password`
- [x] `TopBar` "Switch to Employee/Manager/Admin" menu wired (`switchRole` + navigate) so any session can jump roles to inspect every screen; Profile item navigates to `/profile`

---

## Phase 12: Multi-Role Login + Role Switching — COMPLETE (2026-09-11)

> Verified: `npx tsc --noEmit` exit 0 and `npm run build` success.

### Completed (2026-09-11)
- [x] `src/types/index.ts` — added `roles?: Role[]` to `Employee` type
- [x] `src/utils/roles.ts` (new) — `getEmployeeRoles(employee)` returns `employee.roles ?? [role]`; `homeForRole(role)` returns Admin → `/admin/dashboard`, else `/dashboard`
- [x] `src/mocks/data/employees.ts` — Priya (emp2) `roles: ["manager","employee"]`; Vikram (emp4) `roles: ["admin","manager","employee"]` (enables multi-role picker demo)
- [x] `src/store/slices/authSlice.ts` — removed `DEMO_USERS` map and `switchRole`; `loginUser({email, password})` now resolves employee by `loginEmail` via `employeeService.getByLoginEmail`, validates password/account status, sets `availableRoles`; new `setActiveRole(role)` reducer swaps `user.role`; `logout` clears `availableRoles`
- [x] `src/pages/auth/RoleSelectPage.tsx` (new) at `/select-role` — lists `availableRoles` as tappable cards with role label/description; dispatches `setActiveRole` + navigates to `homeForRole(role)`
- [x] `src/pages/auth/LoginPage.tsx` — removed pre-login role selector; email-first design with 3 quick-fill demo presets (Rahul/Priya/Vikram) labeled with available roles; `handleSubmit` calls `loginUser({email, password})`; redirect: multi-role → `/select-role`, single-role → `homeForRole()`
- [x] `src/components/layout/TopBar.tsx` — switch items now dynamic from `availableRoles` (excluding active role); `onSelect` dispatches `setActiveRole` + navigates to correct home
- [x] `src/app/router/AppRouter.tsx` — `/select-role` route added (ProtectedRoute); removed stale `console.log` in RoleRoute
- [x] Demo flow: Rahul (employee only) logs straight in; Priya (manager + employee) sees role picker; Vikram (admin + manager + employee) sees picker and can switch anytime from TopBar
- [x] `RoleSwitcher` extracted to `src/components/layout/RoleSwitcher.tsx`; now shown on **all layouts** when `availableRoles.length > 1` — TopBar (admin desktop), admin mobile header, and `EmployeeLayout` header (employee/manager screens)

---

## Phase 12.2: Header/TopBar System Unification — COMPLETE (2026-09-11)

> Verified: `npx tsc --noEmit` exit 0 and `npm run build` success.

### Completed (2026-09-11)
- [x] `src/components/layout/Brand.tsx` (new) — single brand block (32px primary "AF" square + name); `showName`/`nameClassName` props; replaces 4 duplicated logo markups (TopBar, AdminSidebar, admin mobile header, EmployeeLayout)
- [x] `src/components/ui/IconButton.tsx` — added `xs` size (`h-9 w-9`) for header icon buttons
- [x] `RoleSwitcher` polish — `h-9` pill aligned with the icon-button row, label hidden below 380px, `title` + `aria-label`
- [x] `TopBar` — Brand + IconButton (theme, bell w/ title/focus ring); role switch items/avatar dropdown unchanged
- [x] `AdminLayout` mobile header — Brand, IconButton hamburger, removed redundant `grow`, solid `bg-surface`
- [x] `AdminSidebar` header — Brand with logo-only when collapsed (was blank)
- [x] `EmployeeLayout` header — `h-14`→`h-16`, solid `bg-surface` (dropped backdrop-blur), Brand name hidden below 420px, bell → IconButton-style with focus ring + `title`, avatar now tappable → `/profile`
- [x] All headers now uniform: `h-16`, solid background, rounded-xl icon buttons, focus rings, `title`/`aria-label`

### Post-Phase Fix (2026-09-11)
- [x] `AdminSidebar` — removed `Attendance` (`/attendance`) + `Leave` (`/leave`) nav items (personal self-service flows); cleaned unused `Calendar`/`Briefcase` imports; admins reach those flows by switching role via `RoleSwitcher`.

---

## Phase 13: Manager Module — COMPLETE (2026-09-11)

> Verified: `npx tsc --noEmit` exit 0 and `npm run build` success.

### Completed (2026-09-11)
- [x] `src/utils/roles.ts` — `homeForRole(MANAGER)` now returns `/team` (manager logins & role-switches land in manager home)
- [x] `src/mocks/data/permissions.ts` — added `attendance.review` to `defaultPermissionsByRole[Role.MANAGER]`
- [x] `src/app/layouts/ManagerLayout.tsx` (new) — admin-style shell: fixed `ManagerSidebar`, desktop `TopBar`, mobile hamburger header + overlay, `RoleSwitcher`
- [x] `src/components/layout/ManagerSidebar.tsx` (new) — nav: Team `/team`, Employees `/team/employees`, Approvals ↓ (Leave, Attendance)
- [x] `src/components/layout/TopBar.tsx` — generalized with `homeTo` / `settingsTo` props (hide Settings item when `settingsTo` omitted)
- [x] `TeamOverviewPage` (`/team`) — StatCards (Team Size, Pending Leave, Pending Approvals) + direct-reports list; team-scoped via `employeeService.getAll({ manager: user.id })`
- [x] `TeamEmployeesPage` (`/team/employees`) — report cards with designation/badge/dept/office/joining/email
- [x] `TeamApprovalsLeavePage` (`/team/approvals/leave`) — Pending/History tabs; Approve (`ConfirmDialog`) + Reject (required-reason modal); `leaveService.approve/reject(id, user.id)`
- [x] `TeamApprovalsAttendancePage` (`/team/approvals/attendance`) — Pending/History tabs; approve/reject corrections via `attendanceService` (mirror of `CorrectionsPage` review flow, read-only)
- [x] `AppRouter` — `/team` route group under `ProtectedRoute` + `RoleRoute allowedRoles={[Role.MANAGER]}`
- [x] Manager self-service — employee pages mounted at `/team/me/*` (Dashboard, Check In/Out, Monthly, Leave+Apply, Profile) inside ManagerLayout; `ManagerSidebar` gained "My Account" section (`ManagerSidebarItem` extract); `LeavePage`/`ApplyLeavePage` sibling links made base-aware (`/team/me` vs `/`)
- [x] Memory bank (02/05/06) updated

---

## Phase 13.5: Backend Master Prompt & Memory Bank Blueprint — COMPLETE (2026-09-11)

> Verified: `BACKEND_PROMPT.md` created with complete multi-phase roadmap, detailed OpenAPI routes, Zod DTO specs, Prisma PostgreSQL database schema, §64 Haversine geofence verification engine, and backend memory bank generation prompts.

### Completed (2026-09-11)
- [x] `BACKEND_PROMPT.md` master specification file created in project root
- [x] Complete Node.js / Express / TypeScript / Prisma / PostgreSQL stack definition & guidelines
- [x] Multi-phase backend roadmap (Phases 1–8: Auth, Org, Employees, Geofence Attendance, Approvals/Leaves, Analytics/Reports, Notifications/RBAC, Hardening/Swagger)
- [x] Full PostgreSQL Prisma schema covering 17 entities (`User`, `Employee`, `Department`, `Designation`, `Team`, `OfficeLocation`, `Shift`, `Attendance`, `BreakLog`, `CorrectionRequest`, `LeaveBalance`, `LeaveRequest`, `Holiday`, `Announcement`, `Notification`, `RolePermission`, `AuditLog`)
- [x] Backend final geofencing validation engine (§64) using Haversine distance formula & 5-stage validation pipeline
- [x] Complete REST API route specifications across 9 modules with standard JSON success/error schemas
- [x] AI agent master prompts for initializing and updating the backend memory bank (`backend-memory-bank/`)

---

## Phase 13.6: Backend Master Prompt v2 (BACKEND_PROMPT.txt) — COMPLETE (2026-09-12)

> Verified: `BACKEND_PROMPT.txt` created as the enhanced standalone master prompt superseding BACKEND_PROMPT.md. Locked stack NestJS + Prisma + SQLite (resolves the .md NestJS/Express + SQLite/PostgreSQL contradictions). Frontend enums synced exactly.

### Completed (2026-09-12)
- [x] `BACKEND_PROMPT.txt` — self-contained prompt for backend agent + backend memory bank (`backend-memory-bank/`, files 00–08)
- [x] Stack locked: NestJS 11, strict TypeScript, Prisma ORM on SQLite, JWT (15m access / 7d hashed rotating refresh), argon2id, Zod DTOs, Multer+csv-parse, Swagger `/api/docs`, @nestjs/throttler, Jest e2e
- [x] 8-phase API roadmap (Foundation/Auth → Org → Employees+CSV → Geo-Attendance §64 → Corrections/Leaves → Dashboard/Reports → Announcements/Notifications/RBAC → Hardening) with per-phase NestJS module map + agent prompts
- [x] 19-model Prisma schema incl. `UserRole` (SQLite-friendly multi-role join, since scalar list `Role[]` is unsupported on SQLite), `BreakLog`, `RolePermission`, `AuditLog`; `@@unique([employeeId,date])`, `date @db.Date`
- [x] Enums matched byte-for-byte to frontend `src/types/enums.ts` (8 AttendanceStatus, 6 LeaveType incl. Maternity/Paternity, 4 EmploymentType incl. Intern, HolidayType, CorrectionStatus, NotificationType, Gender)
- [x] §64 geofence checklist (active user → duplicate open session → Haversine radius → accuracy ≤100m → shift grace/late evaluation) + status rollup engine
- [x] Complete REST contracts across 9 modules (Auth, Employees, Attendance, Corrections, Leaves, Org, Dashboard, Reports, Announcements/Notifications, Roles/Permissions) with canonical error-code catalogue
- [x] 14 permissions seeded from `src/mocks/data/permissions.ts` (ground truth); default role sets; demo login matrix (Rahul/Priya/Vikram, password `password`)
- [x] Memory bank (02, 05) updated

---

## Backend Integration Phase 1–2: Infra + Auth — COMPLETE (2026-09-14)

> Target NestJS backend at `Attendance Management-backend` (port 3001, prefix `/api/v1`). Verified `npx tsc --noEmit` + `npm run build` exit 0.

### Completed (2026-09-14)
- [x] `src/config/index.ts` — `AppConfig` (useMockApi, apiBaseUrl, refreshTokenKey, tokenFitInterval, tokenRefreshTolerance); `.env`/`.env.example` with `VITE_USE_MOCK_API`, `VITE_API_BASE_URL`; `vite-env.d.ts` global ImportMetaEnv typing
- [x] `src/services/http/endpoints.ts` — single source of route strings (`API.auth`, `API.employees`, … `API.reports`) matching backend routes
- [x] `src/services/http/session.ts` — token store (localStorage `attendflow.access-token`/`attendflow.refresh-token`) + `clear()`
- [x] `src/services/http/errors.ts` — `ApiError` (code/message/details + errorMap fallback messages)
- [x] `src/services/http/request.ts` — axios instance; `get/post/put/patch/del<T>` return **unwrapped `data.data`**; single-flight 401 → `POST /auth/refresh` (bare axios, excluded, `_retried`, refresh vs auth endpoints excluded) → on failure `session.clear()` + `attendflow:session-expired` window event; multipart content-type stripped in `buildConfig`
- [x] `src/services/http/mappers.ts` — ISO normalization, `toDateKey`, `toDateTime`, `lowerOrSame`, `parseNumber`
- [x] `src/services/api/auth.api.ts` + `employee.api.ts` — login (jwt+refresh+user), getMe→profile, getAll (full paginated), getByEmployeeId, getById, create/update/setActive(PATCH status), importCsv (13-col CSV → FormData `file`), `getByLoginEmail` (→null stub), `getProfile`
- [x] `src/store/slices/authSlice.ts` — branches on `config.useMockApi` for login/bootstrap/logout (mock branch keeps 800ms + `getByLoginEmail` + `getEmployeeRoles`); `BootstrapResult` union on `createAsyncThunk`, `await unlock()`
- [x] `src/app/bootstrap/SessionBootstrap.tsx`, `AppRouter` — `refreshOnAppLoad` before UI; session-expired listener → navigate `/login`
- [x] `TopBar`/`ProfilePage`/`ManagerSidebar` logout → `logoutUser()` (server revoke + local clear)
- [x] Memory bank (02) updated

## Backend Integration Phase 3: API Modules + Service Branching — COMPLETE (2026-09-14)

> Verified `npx tsc --noEmit` + `npm run build` exit 0. All frontend services now select mock vs real via `config.useMockApi`.

### Completed (2026-09-14)
- [x] `src/services/api/org.api.ts` — departments/designations/teams/shifts/offices/holidays (local `DepartmentPayload`/`DesignationPayload`/`TeamPayload` interfaces to avoid circular type imports; `_count`→`XCount` mappings; `level: String()`; holiday `type.toLowerCase()`; `setActive(id, true)` throws — backend has no reactivation endpoint, lists filter `isActive`)
- [x] `src/services/api/attendance.api.ts` — getToday/getHistory/getMonthly/checkIn/checkOut/startBreak/endBreak/getCorrectionRecords([])/getCorrections/request/approve/reject; `resolveEmployeeFilter` (UUID→EMP code via `employeeApi.getById`, falls back to no-filter on 403); `week_off`→`weekOff`
- [x] `src/services/api/leave.api.ts` — getBalance/getHistory/getAll/apply/cancel/approve/reject with same `resolveEmployeeFilter`
- [x] `src/services/api/notification.api.ts` — `notificationApi` + `announcementApi`; `src/services/api/report.api.ts` — `dashboardApi` (overview/trend/departmentStats/recentCheckIns) + `reportApi` (attendance/late/absent/monthly/leave/overtime + `exportCsv`)
- [x] 14 service files restructured: `export const xxxService = config.useMockApi ? mockXxxService : xxxApi` (renamed mock exports, kept standalone helpers); employee.api gained `getByLoginEmail` + `getProfile`; API method signatures widened to match mock call sites (checkOut payload, endBreak/startBreak/approve/reject/cancel param shapes, requestCorrection)
- [x] Backend response-shape alignment verified against NestJS dashboard/reports services (all keys match FE types 1:1)
- [x] UI real-mode adaptations: `CorrectionsPage` — record lookup now via `attendanceService.getHistory(employeeId)` on selection (fallback for `getCorrectionRecords` → `[]`); `TeamsPage` — member add/remove UI gated on `config.useMockApi`; `EmployeeFormPage` — surfaces `initialPassword` on create (real mode only, one-time banner + "Go to Employees")
- [x] Memory bank (02) updated

---

## Session 2026-09-14: Employee Lookup Access + Re-check-in During Working Hours — COMPLETE

> Verified `npx tsc --noEmit` exit 0 (both repos); backend `npm run lint` clean.

### Completed (2026-09-14)

**Backend — employee lookup open to all roles** (Attendance Management-backend)
- [x] `src/modules/employees/employees.controller.ts` — `GET /employees/by-employee-id/:employeeId` (`getByEmployeeId`) now `@Roles('ADMIN','MANAGER','EMPLOYEE')`; removed `@Permissions('employees.view')` on that method so any authenticated user can look up an employee by EMP code (matches existing `getMe` pattern)

**Re-check-in after checkout (within working hours)** — backend + frontend + mock parity
- [x] `attendance.service.ts` (`Attendance Management-backend`) — `checkIn()` reworked: an existing day record with `checkOut` set → re-check-in path (geo-fence still enforced) clears `checkOut`/checkOut location, adds checkout→check-in gap to `breakMinutes`, resets `workingHours`/`workDurationMinutes`; still 409 if no checkout, 409 `Re-check-in window has ended` outside window. Helpers: `RE_CHECK_IN_BUFFER_MINUTES = 30`, `indiaMinutes()` (UTC+330 offset so FE/BE window edges agree), `isWithinShiftWindow()` (midnight-crossing aware)
- [x] `src/services/shift.service.ts` (FE) — exported `isWithinShiftWindow(shift, now, bufferMinutes=30)` local-time util (midnight wrap)
- [x] `src/components/attendance/AttendanceCard.tsx` — Check In button now shows when `!today || canReCheckIn` (checked out AND within shift window + 30m); checked-out summary label flips to "On break" during the re-check-in window
- [x] `src/services/attendance.service.ts` (FE mock) — `mockAttendanceService.checkIn` handles re-check-in (clear checkOut via shift lookup, add gap to breakMinutes, throw `Re-check-in window has ended` outside window) for `useMockApi` parity
- [x] `src/components/attendance/CheckOutSheet.tsx` — success copy "See you tomorrow!" → "See you soon!"

---

## Session 2026-09-14 (cont.): Geo-check-in/out with Manual Override + Reason — COMPLETE

> Verified `npx tsc --noEmit` (both repos) + frontend `npm run build` + backend `npm run lint`, all exit 0.

### Completed (2026-09-14)
- [x] Backend DTOs — `check-in.dto.ts` / `check-out.dto.ts` gained optional `reason` (trim, ≤500 chars)
- [x] Backend `attendance.service.ts` — `checkIn()`: outside `office.radiusMeters` now rejected ONLY when no `reason` given (else override proceeds); reason stored in `notes` (appended across re-check-in). `checkOut()`: added geo verification — missing location OR outside radius requires a `reason` (else `GEO_OUTSIDE_FENCE` 422); checkout reason appended to `notes`
- [x] FE API + mock parity — `attendance.api.ts` (`reason` in check-in/out payloads), `mockAttendanceService` check-in/out enforce the same outside-radius-without-reason blocking and store `notes`; `Attendance.officeId` added to FE type + mock records
- [x] FE slice — `checkIn`/`checkOut` thunks pass `reason` through
- [x] `LocationVerification.tsx` — OUTSIDE state now offers **Check In With Reason** (inline reason input → `onVerified(location, reason)`)
- [x] `CheckInFlow.tsx` — forwards reason; success step shows "Checked in with reason: …"
- [x] `CheckOutSheet.tsx` — rewritten with location-verification step (verifying → inside-auto-confirm / outside or error → **Check Out With Reason**); confirm summary shows location or reason row; checkout submits `(location, reason)`
- [x] `DashboardPage.tsx` — handles pass reason + location; passes `office` to `CheckOutSheet`

---

## Session 2026-09-14 (cont.): Single Role Removal + Employees Role Filter — COMPLETE

> Verified `npx tsc --noEmit` (both repos) + frontend `npm run build` + backend `npm run lint`, all exit 0. Backend dev server restarted after migration.

### Completed (2026-09-14)

**Backend — multi-role removed, User.role is the single source of truth** (Attendance Management-backend)
- [x] `prisma/schema.prisma` — deleted `UserRole` model + `User.userRoles` relation; migration `20260914131250_remove_userrole` drops the table (applied via `prisma migrate deploy`; generate rerun)
- [x] `prisma/seed.ts` — removed `roles?: string[]` from seeds, Priya/Vikram `roles` arrays, and `userRoles: { create }` on user upsert
- [x] `src/modules/auth/auth.service.ts` — dropped `availableRoles` from `AuthUserBlock`, `userRoles` includes, `orderedRoles`/`ROLE_ORDER`; `buildUserBlock` returns single `role`
- [x] `src/modules/employees/employees.service.ts` — removed `userRoles` from `EMPLOYEE_INCLUDE`, the `userRoles` upsert in `update` (keeps `user.role` update), and `roles` in `serialize`

**Frontend — single-role UX** (Attendance Management)
- [x] `authSlice.ts` — `availableRoles`/`setActiveRole` removed; mock login uses `employee.role`; real login/bootstrap use single `role`
- [x] Deleted `RoleSelectPage.tsx` (`/select-role` route removed) and `RoleSwitcher.tsx`; imports/usage removed from `TopBar`, `EmployeeLayout`, `ManagerLayout`, `AdminLayout`
- [x] `LoginPage` — always navigates to `homeForRole(user.role)`; demo chips single-role (Rahul=Employee, Priya=Manager, Vikram=Admin)
- [x] `types/index.ts` + `mocks/data/employees.ts` + `employee.api.ts` + `auth.api.ts` — `roles`/`availableRoles` removed

**Role filter in Employees list**
- [x] Backend `ListEmployeesQuery` gains `role`; `list()` filters via `where.user = { role: normalizeRole(role) }`
- [x] FE `employee.service.ts` mock `matchesFilters` + `employee.api.ts` `EmployeeFilters`/params + `EmployeesPage` "All roles" `<Select>` (from `ROLE_LABELS`), reset page on change

---

## Session 2026-09-15: 3-Month Attendance History + Manager/Admin Attendance Visibility — COMPLETE

> Verified FE `npx tsc --noEmit` + `npm run build` exit 0; BE `npm run build` + `npm run lint` clean; live API smoke tests: manager list = 19 direct reports all with `attendanceStats`; admin list = 64 with stats; history range filter narrows correctly; manager cross-team history 403 FORBIDDEN; admin reports (attendance/leave/overtime) unscoped & working.

### Completed (2026-09-15)

**Backend** (`Attendance Management-backend`)
- [x] `attendance.controller.ts` / `attendance.service.ts` — `GET /attendance/history` optional `from`/`to` (yyyy-MM-dd) → `Prisma.AttendanceWhereInput` range filter (backward compatible); `resolveViewer` now manager-scopes history to direct reports (403 `FORBIDDEN` otherwise)
- [x] `reports.controller.ts` / `reports.service.ts` — `@CurrentUser()` injected in all report methods; `viewerScope()` helper merges manager direct-report scope into `buildAttendanceWhere`/`getLeaveReport`; `getOvertimeReport` delegates to `getAttendanceReport`; `computeMonthlySummaries` extracted; new `getAttendanceSummaries(month, ids)` + `getTodayStatuses(ids)`
- [x] `employees.controller.ts` / `employees.service.ts` / `employees.module.ts` / `dto/list-employees.query.dto.ts` — optional `statsMonth` on `GET /employees`; MANAGER viewers forced to `where.managerId = viewer.id`; each row gains `attendanceStats { month, present, late, absent, leave, workingHours, today: { status, checkIn } | null }`; module now imports `ReportsModule`

**Frontend** (`Attendance Management`)
- [x] `types/index.ts` — `EmployeeAttendanceStats`; `Employee.attendanceStats?`
- [x] `employee.api.ts` — `statsMonth` filter + `attendanceStats` mapping; `attendance.api.ts` — `getHistory({ from?, to? })`
- [x] `AttendanceMonthView.tsx` (new, reusable) — month prev/next, 6 stat cards, Monday calendar + legend, optional day list; drives `MonthlyAttendancePage`, `AttendancePage` (This Month tab), `EmployeeDetailPage` (Attendance tab)
- [x] `EmployeesPage.tsx` — "Attendance" column + `AttendanceCell` (today badge, P/L/A, %) in table + mobile cards; `statsMonth` in fetch
- [x] `TeamEmployeesPage.tsx` — `statsMonth` fetch + `AttendanceStatsRow` on each card + "View Attendance & Profile" link

---

## Session 2026-09-15 (cont.): Manager Report Download + Dashboard Attendance Cards — COMPLETE

> Verified FE `npx tsc --noEmit` + `npm run build` exit 0; BE `npm run build` + `npm run lint` clean; live API smoke tests: manager monthly report = 20 rows (19 direct reports + self), admin `GET /rbac/roles` shows MANAGER has `reports.export`.

### Completed (2026-09-15)
**Backend** (`Attendance Management-backend`)
- [x] `rbac.constants.ts` — `reports.export` added to `MANAGER_PERMISSIONS`; granted live via `prisma db execute` (`INSERT ... ON CONFLICT DO NOTHING`). Reports controller untouched — it already allows MANAGER + auto-scopes (`viewerScope`) to direct reports

**Frontend** (`Attendance Management`)
- [x] `ManagerSidebar.tsx` — Reports nav item (`FileText`) → `/team/reports` in Team section
- [x] `AppRouter.tsx` — `/team/reports` route (ManagerLayout); `ManagerReportsPage.tsx` (new) reuses admin `ReportsPage` (employee dropdown + report data auto-scoped; export button enabled by new permission)
- [x] `TeamEmployeesPage.tsx` — "Download Attendance" header button → monthly summary CSV for the manager's team
- [x] `TeamOverviewPage.tsx` — `statsMonth` on `getAll`; stat grid → Team Size / Present Today (today present|late) / On Leave Today (today leave) / Pending Leave / Pending Approvals (5 cards, updated skeleton)

---

## Session 2026-09-15 (cont.): Derive Today Attendance Status + Manager Absent/Late Cards — COMPLETE

> Verified FE `npx tsc --noEmit` + `npm run build` exit 0; BE `npm run build` + `npm run lint` clean. Live API smoke tests (Tue 2026-09-15): admin `/employees?statsMonth=2026-09` shows `attendanceStats.today` = 61 absent / 1 present (EMP1039, checkIn 09:00) / 1 late (EMP1037, checkIn 10:05) / 1 leave (EMP1023, derived from approved leave — no attendance record).

### Completed (2026-09-15)
**Backend** (`Attendance Management-backend`)
- [x] `reports.service.ts` — `getTodayStatuses(employeeIds)` now DERIVES today status: attendance record win (lowercased status + checkIn); else approved leave covering today → `leave`; else Sunday/holiday (reuses `eligibleHolidays`) → `null` (renders "—"); else → `absent`. User chose immediate-absent semantics (matches admin dashboard `absentToday = total − present − onLeave`) and blank weekends/holidays. Attendance rows store `date` at UTC midnight so `date: todayDay` equality matches real records.

**Frontend** (`Attendance Management`)
- [x] `TeamOverviewPage.tsx` — added **Late Today** (`Clock`, warning) and **Absent Today** (`UserX`, danger) cards counting `attendanceStats.today.status`; grid → 7 cards (`grid-cols-2 sm:grid-cols-3 xl:grid-cols-7`); skeleton 7; imports `UserX`/`Clock`
- [x] Admin `EmployeesPage` + manager `TeamEmployeesPage` today cells needed NO changes — they already render the badge; backend now populates it

**Note:** smoke data left live for browser QA — today attendance records EMP1037 (LATE) + EMP1039 (PRESENT), approved leave EMP1023/Nisha Agarwal (today). Remove via `prisma db execute` when done.

---

## Session 2026-09-15 (cont.): Manual Check-In/Out for Admin & Manager — COMPLETE

> User: "Attendance Corrections option both admin and manager also both have option approve also in this section manager and admin then can manually checkin/out and checkout an employ". Verify: FE `npx tsc --noEmit` + `npm run build` exit 0; live API smoke: admin punch → late 8.25h, manager direct-report punch → present 9h, manager non-report punch → 403.

### Completed (2026-09-15) — frontend (`Attendance Management`)
- [x] Backend `POST /attendance/manual` already existed (`AttendanceService.manualPunch`, `@Roles('ADMIN','MANAGER')` + `@Permissions('attendance.review')`, manager restricted to direct reports) — **no backend changes**
- [x] `endpoints.ts` — `API.attendance.manual = "/attendance/manual"`
- [x] `attendance.api.ts` — `ManualAttendanceInput` interface + `manualPunch()` (posts, maps via `mapAttendance`)
- [x] `src/components/attendance/ManualAttendanceModal.tsx` (NEW) — reusable RHF+Zod modal (Employee/Date/Check-in/Check-out/Status auto|present|late|absent|half_day/Reason); schema refines: at least one of in/out/status, check-out requires check-in, check-out after check-in; toast success/error; `onRecorded` reload
- [x] Admin `CorrectionsPage.tsx` — "Manual Check-In/Out" button (UserCog) + modal with **all employees**
- [x] Manager `TeamApprovalsAttendancePage.tsx` — same button + modal with **direct reports only** (options built from existing `employeeService.getAll({ manager })`)
- [x] Live smoke: admin punch EMP1024 2026-09-10 10:15→18:30 → late 8.25h; Priya punch EMP1024 09-11 → present 9h; Priya punch Farhan (EMP1030, non-report) → 403 FORBIDDEN; both smoke Attendance rows deleted via `prisma db execute`

---

## Session 2026-09-15 (cont.): Tabbed Corrections (no approval) + Manager Notifications + .env.example removal — COMPLETE

> User: "Attendance Corrections option for both admin and manager and also no need approvel, remove pending tab … in manager also show optin notification … remove .env.example file from both f and b". Clarified: "give both Check-In/Out corrections tab" — **both** admin + manager pages get a **Check-In/Out** tab (inline manual form) and a **History** tab. Verified FE `npx tsc --noEmit` + `npm run build` exit 0; BE `npm run build` + `npm run lint` clean; live API smoke: admin login + corrections list, manager corrections (team-scoped), manager manual punch direct report → 200 late 8.12h; smoke Attendance row deleted via `prisma db execute`.

### Completed (2026-09-15) — frontend (`Attendance Management`)
- [x] `src/components/attendance/ManualAttendanceForm.tsx` (NEW) — inline Card form (replaces `ManualAttendanceModal`): same Employee/Date/Check-in/Check-out/Status/Reason fields + RHF+Zod schema; props `employeeOptions`, `onRecorded`; submits via `attendanceService.manualPunch` → toast + reload. Manual punches do NOT create `CorrectionRequest` → not shown in History (accepted trade-off)
- [x] `ManualAttendanceModal.tsx` — deleted (no remaining references)
- [x] Admin `CorrectionsPage.tsx` — rewrite to Tabs **Check-In/Out** (`ManualAttendanceForm`, all employees) / **History** (read-only all `CorrectionRequest` with status badge). Removed: Pending tab, approve/reject handlers, `ReviewTarget`/`ConfirmDialog`, "New Correction" request modal, `useToast`/`useAppSelector`
- [x] Manager `TeamApprovalsAttendancePage.tsx` — same tab rewrite with direct-report options; heading → "Attendance Corrections"; approval UI removed
- [x] `TeamOverviewPage.tsx` — removed orphaned `pendingCorrections` state + commented StatCard + `attendanceService` import (fixed TS6133); stat grid → 6 cards
- [x] Manager notifications: `ManagerSidebar` `Bell` nav item → `/team/me/notifications`; `AppRouter` adds `me/notifications` route + extends `AdminNotificationsGate` (MANAGER → `/team/me/notifications`); `ManagerLayout` `<TopBar notificationsTo="/team/me/notifications">` so the manager bell renders the shared `NotificationsPage` inside the manager shell
- [x] `.env.example` deleted from FE + BE (per user); memory-bank `.env.example` mentions trimmed (`02-active-context.md`, `04-tech-context.md`)
- [x] No backend code changes — `POST /attendance/manual` + corrections APIs unchanged

---

## Session 2026-09-15 (cont.): Formal "Corrections" tab (direct apply → approved history), admin & manager — COMPLETE

> User: "also add currection tab for both admin and manager" → chose **Formal correction flow**: pick employee+date, preview existing record, edit check-in/out/status + reason, applied directly with no approval, and the correction DOES appear in History. Verified FE `npx tsc --noEmit` + `npm run build` exit 0; BE `npm run build` + `npm run lint` clean; live smoke all passing; smoke records cleaned via `prisma db execute`. (Note: the running backend was stale `dist/main` — rebuilt + restarted to serve the new endpoint.)

### Completed (2026-09-15)
**Backend** (`Attendance Management-backend`)
- [x] `dto/direct-apply-correction.dto.ts` (NEW) — `DirectApplyCorrectionDto` (`employeeId`, `date`, optional `checkIn`/`checkOut`/`status`, required `reason` 5–500); zod refines same as `ManualAttendanceDto`
- [x] `corrections.controller.ts` — `POST /attendance/corrections/direct` (@Roles ADMIN/MANAGER + @Permissions attendance.review)
- [x] `corrections.service.ts` — `directApply()`: ADMIN/MANAGER + direct-report guard (403); mirrors `manualPunch` time/status/working-hours derivation; transaction = update-or-create `Attendance` + create `CorrectionRequest` with `status: APPROVED` (`requestedBy`/`reviewerId` = actor, `reviewedAt` now, `original*` from pre-apply record/`INCOMPLETE`, `corrected*` applied); audit CREATE/UPDATE attendance + APPLY correction

**Frontend** (`Attendance Management`)
- [x] `endpoints.ts` — `correctionsDirect: "/attendance/corrections/direct"`
- [x] `attendance.api.ts` — `applyDirectCorrection()` → POST → `mapCorrection`
- [x] `src/components/attendance/DirectCorrectionForm.tsx` (NEW) — employee+date → auto-preview (`getHistory`) panel → pre-filled editable check-in/out/status + required reason → `applyDirectCorrection` → toast + `onRecorded()`
- [x] Admin `CorrectionsPage.tsx` + manager `TeamApprovalsAttendancePage.tsx` — 3rd tab **Corrections** (`DirectCorrectionForm`)

**Live smoke** — admin direct apply → approved entry first in corrections list; manager direct apply on same date → updated record (`originalStatus: late` → corrected); check-out-without-check-in → 400 zod validation; smoke rows deleted (quoted Prisma table names `"CorrectionRequest"`/`"Attendance"`).

---

## Session 2026-09-15 (cont.): Remove Team Employees Download Button — COMPLETE

> User: downloads belong in the Reports section, not the Employees page. Verified FE `npx tsc --noEmit` + `npm run build` exit 0.

### Completed (2026-09-15)
- [x] `TeamEmployeesPage.tsx` — removed whole-team monthly-summary "Download Attendance" button (`handleDownload`, `isDownloading`, unused `Download`/`Button`/`useToast`/`reportService` imports). `/team/reports` CSV export (per-report, `reports.export`) remains the download surface for managers
- [x] `permission.service.ts` — fixed `reports.export` missing from FE `DEFAULT_PERMISSIONS[Role.MANAGER]` so the Download/export button actually renders on `/team/reports` for managers (backend DB grant alone was never enough — `getRoles()`/`/rbac/roles` is ADMIN-only and only loaded by admin RolesPage, so managers always use FE defaults)

---

## Session 2026-09-15 (cont.): /team Route Restructure + Notifications Infinite Scroll — COMPLETE

> Verified `npx tsc --noEmit` exit 0 (only pre-existing `TeamsPage` unused-import error remains; filtered).

### Completed (2026-09-15)
- [x] Renamed all `/team/me*` manager self-service routes to flat `/team/*` (`AppRouter.tsx`): `me`→`dashboard`, `me/attendance`→`attendance`, `me/attendance/monthly`→`attendance/monthly`, `me/leave`→`leave`, `me/leave/apply`→`leave/apply`, `me/notifications`→`notifications`, `me/profile`→`profile`; `/team` index keeps `TeamOverviewPage`; manager notification redirect → `/team/notifications`
- [x] `ManagerLayout.tsx` TopBar → `profileTo="/team/profile"`, `notificationsTo="/team/notifications"`; `utils/roles.ts` `homeForRole(MANAGER)` → `/team/dashboard`
- [x] `ManagerSidebar.tsx` My Account nav → `/team/dashboard`, `/team/attendance`, `/team/attendance/monthly`, `/team/leave`, `/team/notifications`, `/team/profile`
- [x] `LeavePage.tsx` + `ApplyLeavePage.tsx` base-aware link base `/team/me` → `/team` (grep: no `/team/me` references remain)
- [x] `NotificationsPage.tsx` — client-side infinite scroll: `PAGE_SIZE = 20`, `IntersectionObserver` bottom sentinel (`rootMargin 150px`, 300ms simulated load), `SkeletonCard` indicator, sentinel removed at end; backend API unchanged (returns all items)

---

## Session 2026-09-15 (cont.): Admin Notifications inside Admin Layout — COMPLETE

> User: admin notifications page must show the sidebar. Verified FE `npx tsc --noEmit` + `npm run build` exit 0.

### Completed (2026-09-15)
- [x] Root cause: `/notifications` only existed under the employee `EmployeeLayout` route tree, so admins landed on the mobile bottom-nav layout (no sidebar) via `AdminSidebar` item or `TopBar` bell
- [x] `AppRouter.tsx` — added `/admin/notifications` under the `/admin` `AdminLayout` block (shared `NotificationsPage`); new `AdminNotificationsGate` wraps the employee `/notifications` route and redirects ADMIN → `/admin/notifications`
- [x] `AdminSidebar.tsx` — Notifications nav item → `/admin/notifications`
- [x] `TopBar.tsx` — new `notificationsTo` prop (default `/notifications`), used by the bell link
- [x] `AdminLayout.tsx` — passes `notificationsTo="/admin/notifications"`; manager/employee layouts unchanged (manager bell still → employee `/notifications`)

---

## Session 2026-09-15 (cont.): FCM Push Notifications (backend + frontend) — COMPLETE (credential-gated)

> User: "implement notification with fcm taken". User chose "Implement gated, creds later" + "Match current notifications" (push = leave approved → requester, leave rejected → requester, announcements → all active employees; leave *apply* still sends nothing). Verified BE `npm run build` + `npm run lint` clean; FE `npx tsc --noEmit` + `npm run build` exit 0; live smoke: device-token register/revoke/re-register OK, announcement fan-out created in-app notification (push silently disabled). End-to-end push untestable locally until real Firebase/VAPID creds are supplied.

### Completed (2026-09-15)
**Backend** (`Attendance Management-backend`)
- [x] `prisma/schema.prisma` — `FcmToken` model (userId FK, unique token, platform, lastUsedAt, `@@index([userId])`); migration `20260915081424_fcm_push_tokens` applied + `prisma generate` rerun (needed a dev-server stop/restart after an EPERM DLL lock)
- [x] `src/modules/push/push.module.ts` (@Global) + `fcm.service.ts` (NEW) — `onModuleInit` lazy `initializeApp` only when `PUSH_ENABLED` + service account; `send(userIds, payload)` → `sendEachForMulticast` with unregistered-token pruning + `lastUsedAt` bump; uses firebase-admin module-scoped imports (v13 namespace fix)
- [x] `src/config/configuration.ts` — `push` config block; `app.module.ts` registers `PushModule`
- [x] `notifications.service.ts` — `notify({ userIds, title, message, type, link })` (transactional in-app `createMany` + FCM send; errors swallowed → in-app only), `registerDeviceToken`/`revokeDeviceToken`/`clearDeviceTokens`; Nest `Logger` (no console)
- [x] `leaves.service.ts` approve/reject + `announcements.service.ts` `fanOut` now emit via `notify()`; both modules import `NotificationsModule`
- [x] `notifications.controller.ts` + `dto/register-device-token.dto.ts` — `POST`/`DELETE /notifications/device-token` (all roles)
- [x] `.env.example` — `PUSH_ENABLED` / `FIREBASE_SERVICE_ACCOUNT` / `FIREBASE_PROJECT_ID`

**Frontend** (`Attendance Management`)
- [x] `npm i firebase@12.19.0`
- [x] `src/config/firebase.ts` (NEW) — `firebaseConfig` (`VITE_FIREBASE_*` incl. VAPID), `isFirebaseConfigured()`
- [x] `src/services/fcm/fcm.service.ts` (NEW) — modular SDK: `init()` (permission → `getToken({ vapidKey })` → backend register), `stop()` (backend revoke + `deleteToken`), `onMessage(cb)`; SW registered with config in the URL (public/ SW can't read `meta.env`)
- [x] `src/services/fcm/useFcmPush.tsx` (NEW) — `FcmPushProvider` in `main.tsx`; wires on auth, dispatches `addNotification` from foreground messages, revokes + resets on logout (per-user token)
- [x] `src/services/http/request.ts` — `delWithBody<T>` (revoke endpoint takes a body); `endpoints.ts` + `notification.api.ts` — `registerDeviceToken`/`revokeDeviceToken`
- [x] `src/vite-env.d.ts` + `.env.example` — `VITE_FIREBASE_*` (8 keys)
- [x] `public/firebase-messaging-sw.js` (NEW) — compat importScripts, `onBackgroundMessage` → `showNotification`, `notificationclick` focuses/navigates

### Other sessions completed 2026-09-15 (see 02-active-context.md for details)
- [x] Derive today attendance status + manager Absent/Late cards (7-card `/team` grid) — live-verified
- [x] Remove "Download Attendance" from manager Employees page + fix manager `reports.export` FE default permission
- [x] Admin notifications inside `AdminLayout` (`/admin/notifications` + gate)

---

## Session 2026-09-15 (cont.): Attendance/Leave Event Push Notifications — COMPLETE (credential-gated)

> User answered clarifying questions: check-in/out notify "User + their manager"; early checkout rule = before `shift.endTime − earlyCheckoutMinutes`; shift-over reminder "Also remind no-shows"; leave apply notifies the direct manager only. All recipients get in-app notification + FCM push via `NotificationsService.notify()` (push still gated on real Firebase creds). Verified BE `npm run build` + `npm run lint` clean; live API + standalone-context smoke all passing. No frontend changes (labels/handlers already cover ATTENDANCE/LEAVE).

### Completed (2026-09-15) — backend (`Attendance Management-backend`)
- [x] `npm i @nestjs/schedule`; `app.module.ts` — `ScheduleModule.forRoot()` (cron infra for reminders)
- [x] `attendance.module.ts` — imports `NotificationsModule`, provides `AttendanceReminderService` alongside `AttendanceService`
- [x] `attendance.service.ts` — injects `NotificationsService`; `getEmployee()` selects `manager: { select: { userId } }`; helpers `formatTime12h(date)` + `formatWorked(minutes)` (reuse `indiaMinutes`/`timeToMinutes`); check-in/out now notify user + manager; early-checkout alert pair when checkout < `end − earlyCheckoutMinutes` (overnight/incomplete shifts skipped); shared `notifyManager()` guards no-manager / self
- [x] `leaves.service.ts` — `getEmployee()` selects `manager.userId`; `apply()` (after balance upsert) notifies the direct manager `New leave request / <Name> (<EMP####>) applied for <type> leave <start> to <end> (<days> day(s))`, type LEAVE, link `/team/approvals/leave`, skipped when no manager
- [x] `attendance-reminder.service.ts` (NEW) — `@Cron('*/15 * * * *', { timeZone: 'Asia/Kolkata' })` `scan()`: IST date-key resets the `sentToday` Set; skips Sundays + public holidays; `sendCheckOutReminders` (open records on non-overnight ended shifts → `Reminder: check out`, `/attendance`) + `sendNoShowReminders` (active shift employees without a record today → `Missed check-in`); in-memory dedupe `${employeeId}:${dateKey}:checkout|noshow`; overnight shifts deliberately skipped (end falls next calendar day)

### Verification — live smoke (2026-09-15, all passing)
- Manish (EMP1009) check-in/out at Delhi Office → own `Checked in`/`Checked out`/`Early checkout alert`; manager Priya → `Team check-in`/`Team check-out`/`Early checkout alert` (employee-named). Rahul leftover open record checkout → `Checked out · worked 24m` + `Early checkout alert`.
- Manish leave apply (casual, 2d) → Priya got `New leave request / Manish Verma (EMP1009) applied for casual leave … (2 days)` (LEAVE type).
- Reminder via `NestFactory.createApplicationContext` + temp `Reminder-Test-Shift` (09:00–10:00): Arjun open record → 1 `Reminder: check out`; Sneha no-record → 1 `Missed check-in`; rerun `scan()` → 0 new (dedupe OK); temp shift/records/notifications cleaned up.

---

## Session 2026-09-15 (cont.): Fix Checkout/Check-in "Validation failed" on degraded GPS accuracy — COMPLETE

> Reported by user: checking out fails with "Validation failed". Reproduced/located: browser GPS accuracy occasionally exceeds the 5000m cap in the DTO (`locationSchema`), and `z.number().max(5000)` rejects it as a hard `VALIDATION_FAILED` 400. Since accuracy is only a stored diagnostic (the geofence decision uses haversine distance), it should clamp, not reject.

### Completed (2026-09-15) — backend (`Attendance Management-backend`)
- [x] `check-out.dto.ts` — `locationSchema.accuracy` changed from `z.number().min(0).max(5000).optional().default(0)` to `z.number().optional().transform(v => v === undefined ? 0 : Math.min(5000, Math.max(0, v)))` (clamps out-of-range values instead of rejecting; NaN/Infinity still throw `invalid_type`)
- [x] `check-in.dto.ts` — same fix (identical bound / same failure mode on check-in)
- [x] Rebuilt (`npm run build` clean) + restarted server on :3001 with new build
- [x] Verified live: checkout with `accuracy: 6200` → 200 OK with stored accuracy clamped to 5000; reason-only checkout unaffected (200 when valid); normal accuracy values unchanged. `npm run lint` clean.

---

## Session 2026-09-16: Implement real logo (public/logo.svg) — COMPLETE

> The app previously rendered a text "AF" chip as the brand mark. A real app icon (`24 Attendance Management` — a 24-hour clock inside a gradient rounded-rect) already exists at `public/logo.svg` and `public/favicon.svg` (identical). Added a reusable `Logo` component and wired it into the brand mark, login, and forgot-password screens. Pre-existing `TS6133` (unused `TeamsPage` import with a commented-out route) removed so the build passes clean.

### Completed (2026-09-16)
- [x] `src/components/ui/Logo.tsx` (NEW) — renders `/logo.svg` from `public/`; props `size` (sm 8/h-8 · md h-10 · lg h-14 · xl h-16), `className`, `alt`. The SVG already carries its own gradient + rounded-rect background, so no wrapper chip is needed.
- [x] `src/components/layout/Brand.tsx` — mark is now `<Logo size="sm" />` (was a `bg-primary` rounded square with "AF" text); still accepts `markClassName`/`nameClassName`, so TopBar/Admin & Manager sidebars/Employee/Admin/Manager layout headers all show the real logo automatically.
- [x] `src/pages/auth/LoginPage.tsx` — logo chip replaced with `<Logo size="xl" className="mx-auto mb-4" />`.
- [x] `src/pages/auth/ForgotPasswordPage.tsx` — same 64px logo mark replacement.
- [x] `src/app/router/AppRouter.tsx` — dropped unused `TeamsPage` import (route was commented out → `TS6133`).
- [x] Favicon already `/favicon.svg` (identical to logo) — no change needed.
- [x] Verified: `npx tsc --noEmit` exit 0; `npm run build` exit 0.

## Session 2026-09-16 (cont.): Forgot Password via Email OTP (Resend) — IMPLEMENTED, LIVE SMOKE PENDING

> Real `POST /auth/forgot-password` (sends 6-digit OTP via Resend with dev-console fallback), `POST /auth/verify-otp` (validate without consuming) and `POST /auth/reset-password` (was a 501 stub) on the NestJS backend; frontend `/forgot-password` is now a 3-step RHF+Zod wizard (Email → OTP + 60s Resend → New password). Backend build + lint clean; FE `tsc` + `build` clean. **Not yet live-smoked — backend dev server was killed to free the Prisma engine DLL and hasn't been restarted.**

### Completed (2026-09-16)
**Backend**
- [x] `npm i resend` (resend@6.28.1).
- [x] Prisma `PasswordResetOtp` model (userId FK cascade, otpHash, expiresAt, usedAt?, attempts default 0, createdAt, `@@index([userId])`) + `User.passwordResetOtps`; migration `20260916060054_password_reset_otp` applied; `prisma generate` re-run.
- [x] `src/config/configuration.ts` — `resend` block (apiKey, fromEmail default `AttendFlow <no-reply@attendflow.in>`, otpLength 6, otpTtlMinutes 10, otpMaxAttempts 5, resendCooldownSeconds 60) + env overrides `RESEND_FROM_EMAIL`, `RESET_OTP_LENGTH`, `RESET_OTP_TTL_MINUTES`, `RESET_OTP_MAX_ATTEMPTS`, `RESET_OTP_RESEND_COOLDOWN`; `.env` updated.
- [x] `src/modules/mail/*` (NEW, @Global, registered in `app.module.ts`) — `MailService` wraps `new Resend(apiKey)`; `sendOtpEmail({toEmail, recipientName, otp, expiresInMinutes})` returns boolean, never throws, dev-console OTP fallback when apiKey unset/send fails in non-production; honors Resend `RATE_LIMITED`.
- [x] New DTOs `verify-otp.dto.ts` (`/^\d{6}$/`) + `reset-password.dto.ts` (newPassword 6–128).
- [x] Error codes `OTP_INVALID` / `OTP_EXPIRED` / `OTP_ATTEMPTS_EXCEEDED`.
- [x] `AuthService`: `forgotPassword` (anti-enumeration generic response, inactive skip, 60s cooldown → 429 `RATE_LIMITED`, transaction invalidate-old + create-new OTP, sha256 hash), `verifyOtp` (no consume), `resetPassword` (transaction: update passwordHash, mark used, revoke ALL refresh tokens, audit `password_reset`), `generateOtp` (randomInt), `assertOtpMatches` (attempts++, consume at 5).
- [x] `AuthController`: `POST /auth/verify-otp` + implemented `POST /auth/reset-password` (was 501).
- [x] Verified: backend `npm run build` + `npm run lint` exit 0.

**Frontend**
- [x] `endpoints.ts` — `API.auth.verifyOtp` + `API.auth.resetPassword`.
- [x] `auth.api.ts` — `forgotPassword(email)`, `verifyOtp(email, otp)`, `resetPassword(email, otp, newPassword)`.
- [x] `errors.ts` — `ApiErrorCode` union += `OTP_INVALID/OTP_EXPIRED/OTP_ATTEMPTS_EXCEEDED`.
- [x] `components/ui/OtpInput.tsx` (NEW) — 6-box single-digit input: numeric, auto-advance, backspace, paste, autofill, error/disabled.
- [x] `pages/auth/ForgotPasswordPage.tsx` — 3-step wizard (`StepIndicator`, `OtpInput`, 60s Resend cooldown, RHF+Zod, success screen; OTP-related reset failures map back to step 2; `OTP_ATTEMPTS_EXCEEDED`/`OTP_INVALID` re-enable Resend). Uses `bg-primary-50 dark:bg-primary-900/30` (avoided `bg-primary/20` — v4 won't emit opacity for the custom `--primary` class).
- [x] Verified: `npx tsc --noEmit` exit 0; `npm run build` exit 0.

### Pending / Known Issues
- [ ] Live smoke (backend must be restarted on :3001 first): existing/non-existing email identical response, resend cooldown 429, wrong OTP, 5-attempt lockout, full reset then login + revoked refresh token; restore demo password `password`.
- [ ] No UI to view/log the email, only dev-console OTP fallback — expected given no `RESEND_API_KEY`.

---

## Spec-Section → Phase Map

| Spec § | Module | Phase |
|--------|--------|-------|
| §12 | Authentication (login, roles, forgot/reset password) | 1 (reset-password todo) |
| §13-20 | Employee dashboard + check-in/out + location + timers | **2** |
| §21-22 | Attendance history + monthly calendar | 3 |
| §23 | Leave management (balance, apply, history) | 4 |
| §24-25 | Profile + notifications | 5 |
| §26 | Admin dashboard (stats + Recharts) | 6 |
| §27-30 | Employee management (CRUD, details, attendance) | 7 |
| §31-34 | Corrections, departments, designations, teams | 8 |
| §36-39 | Shifts, locations, Google Maps, holidays | 9 |
| §40-41 | Reports + employee import wizard | 10 |
| §42-43 | Announcements + roles & permissions | 11 |
| §35 | Manager views (/team*) | 13 |
| §54-56 | Dark mode polish + PWA (manifest/install) | 14 |

---

## Session 2026-09-14 (cont.): Complete Mock Removal + Backend RBAC + EmployeeForm UX — COMPLETE

> Verified `npx tsc --noEmit` (both repos) + frontend `npm run build` + backend `npm run lint`, all exit 0. Backend live-tested: login as admin, GET/POST/PATCH rbac endpoints, ADMIN edit blocked, invalid perm rejected.

### Completed (2026-09-14)

**Frontend — mock layer deleted**
- [x] `src/config/index.ts` — removed `useMockApi` from `AppConfig` interface and `config` object
- [x] `.env` / `.env.example` — removed `VITE_USE_MOCK_API` line
- [x] `src/store/slices/authSlice.ts` — removed the 3 `config.useMockApi` branches (mock login short-circuit, bootstrap early return, mock logout path); cleaned unused `config` and `employeeService` imports
- [x] Collapsed 14 service files to real API re-exports: `department.service.ts`, `designation.service.ts`, `holiday.service.ts`, `location-office.service.ts`, `shift.service.ts` (kept `isWithinShiftWindow`/`getShiftDuration`/`formatShiftDuration`/`formatTime12h`/`shiftToForm` utilities), `team.service.ts`, `employee.service.ts` (re-exports `employeeApi` + `EmployeeFilters` type), `attendance.service.ts` (re-exports `attendanceApi` + `MonthlyAttendance` interface), `dashboard.service.ts` (re-exports `dashboardApi` + 4 type interfaces), `report.service.ts` (re-exports `reportApi` + report type interfaces), `leave.service.ts` (re-exports `leaveApi` + `ApplyLeaveData` type), `notification.service.ts` (re-exports `notificationApi`), `announcement.service.ts` (re-exports `announcementApi`)
- [x] `src/services/permission.service.ts` — rewritten to call `rbacApi`; inline default permission map (no mock file import); module-level roles cache
- [x] Deleted `src/mocks/` directory entirely
- [x] `TeamsPage.tsx` — removed mock-only member add/remove UI (no backend endpoint for team membership management); cleaned imports (`config`, `IconButton`, `X`, `Employee` type removed)

**Backend — RBAC module** (`Attendance Management-backend`)
- [x] `src/modules/rbac/rbac.constants.ts` — 14-entry `PERMISSION_CATALOGUE` (matching original FE mock), `MANAGER_PERMISSIONS` (6), `EMPLOYEE_PERMISSIONS` (1), `ROLE_META` (ADMIN/MANAGER/EMPLOYEE name+description)
- [x] `src/modules/rbac/dto/update-role-permissions.dto.ts` — Zod schema (`permissionIds: string[]`, max 100 entries)
- [x] `src/modules/rbac/rbac.service.ts` — `getPermissions()` returns catalogue; `getRoles()` groups `rolePermission` rows by role; `updateRolePermissions(role, permissionIds)` rejects ADMIN (403), validates ids against catalogue (400), `$transaction` deleteMany+createMany
- [x] `src/modules/rbac/rbac.controller.ts` — `GET /rbac/permissions` (ADMIN), `GET /rbac/roles` (ADMIN), `PATCH /rbac/roles/:role/permissions` (ADMIN + `settings.manage` permission)
- [x] `src/modules/rbac/rbac.module.ts` — registered in `app.module.ts`
- [x] `prisma/seed.ts` — removed local `PERMISSIONS`/`MANAGER_PERMISSIONS` arrays; imports from `rbac.constants`; `rolePermissionSets` now uses `EMPLOYEE_PERMISSIONS` for the EMPLOYEE role

**Frontend — RBAC API wiring**
- [x] `src/services/http/endpoints.ts` — added `rbac.permissions`, `rbac.roles`, `rbac.rolePermissions(role)`
- [x] `src/services/api/rbac.api.ts` (new) — `getPermissions()`, `getRoles()`, `updateRolePermissions(roleId, permissionIds)` via GET/PATCH; minimal type mapping for backend `RawRole` → FE `Role_`
- [x] `src/services/permission.service.ts` — rewritten; calls `rbacApi`; sync `hasPermission` uses ADMIN true rule + module-level roles cache + inline default fallback map (no mock file dependency)

**EmployeeFormPage UX changes**
- [x] `src/pages/admin/EmployeeFormPage.tsx` — manager options fetched via `employeeService.getAll({ role: "manager", pageSize: 100 })` (only MANAGER-role employees, excludes self when editing); Role `<Select>` moved to top of Employment section; Reporting Manager field hidden when `role === "admin"` (via `useWatch({ control, name: "role" })` + conditional render); `setValue("managerId", undefined)` effect when role changes to admin
- [x] Added `useWatch` import from `react-hook-form`, added `control` to useForm destructure

---

## Session 2026-09-14 (cont.): Remove Department (FE) + Make Backend Optional — COMPLETE

> Verified FE `npx tsc --noEmit` + `npm run build` exit 0; BE `npx tsc --noEmit` + `npm run lint` clean, `prisma validate` OK. Live API smoke tests: designation/team/employee created without department (`departmentId: null`), CSV import with no Department column OK.

### Completed (2026-09-14)

**Frontend — Department suppressed everywhere**
- [x] `AdminSidebar.tsx` — "Departments" nav item removed; `AppRouter.tsx` — `DepartmentsPage` import + `/departments` route removed; `DepartmentsPage.tsx` stubbed to `return null` (preserve-for-restore comment)
- [x] `DesignationsPage.tsx` — department schema field, `departmentOptions` state/fetch, card subtitle, Department Select removed; `TeamsPage.tsx` — same removal from create form (name + manager only) + card subtitle
- [x] `EmployeeFormPage.tsx` — `departmentId` out of Zod schema/state/fetch + Department Select dropped from `Promise.all`
- [x] `EmployeesPage.tsx` — Department filter/column/cell/mobile line removed; `ReportsPage.tsx` — `departmentId` removed from state, baseFilter, all 6 mappers + columns, both filter Selects
- [x] `ImportPage.tsx` — "department" removed from `REQUIRED_FIELDS`, template rows, refs, validation, preview; copy 13→12 columns + "Email required"
- [x] `EmployeeDetailPage.tsx` (`InfoRow`), `SettingsPage.tsx` (org desc → "Teams and designations"), `ProfilePage.tsx` (employment + header), `TeamEmployeesPage.tsx` (mobile card) — Department references removed

**Frontend — types**
- [x] `src/types/index.ts` — `departmentId?` on `Employee`, `EmployeeFormData`, `ImportRow`, `Designation`, `Team`
- [x] `src/services/api/org.api.ts` — `DesignationPayload`/`TeamPayload` optional `departmentId`, raw `string | null`, mappers `?? undefined`; `employee.api.ts` — `buildImportCsv` `row.departmentId ?? ""`

**Backend — Optional Department** (`Attendance Management-backend`)
- [x] `prisma/schema.prisma` — `Designation.departmentId String?` + `Department?`, `Team.departmentId String?` + `Department?`; migration `20260914085647_department_optional` applied; `prisma generate` rerun
- [x] `create-designation`/`create-team` DTOs — `departmentId` optional; id validation relaxed `cuid` → generic `min(1).max(64)` (fixes team-create against `uuid()` DB); `create-department` DTO `managerId` same relaxation
- [x] `designations`/`teams` services — `create` guards optional department with findUnique + NOT_FOUND, stores `?? null`
- [x] `employees.service.ts` — `importCsv` maps `departmentId: context.departmentId ?? null` (removed `departments[0]` fallback)

---

## Session 2026-09-14 (cont.): Dual Visibility Approval (Leave + Corrections) — COMPLETE

> Verified FE `npx tsc --noEmit` + `npm run build` exit 0; BE `npx tsc --noEmit` + `npm run lint` clean. Live API smoke tests: employee leave visible to manager + admin; manager self-approve blocked (403); admin approves manager/employee leaves; manager approves direct report's leave; corrections scoped to direct reports for managers.

### Completed (2026-09-14)

**Backend** (`Attendance Management-backend`)
- [x] `leaves.service.ts` — `list()`: ADMIN → all leaves; MANAGER → direct reports' + own; EMPLOYEE → own; `filterEmployeeId` unchanged. Added `assertCanReview(userId, requestOwnerManagerId)`: MANAGER can only review a request whose owner's `managerId` equals the reviewer's employee id (else 403), ADMIN unrestricted. `approve`/`reject` lookups now include `employee.managerId`
- [x] `corrections.service.ts` — `list()`: MANAGER scoped to direct reports' corrections (was ALL); ADMIN → all, EMPLOYEE → own. Same `assertCanReview` guard added to `approve`/`reject`
- [x] No schema migration / endpoint changes required

**Frontend** (`Attendance Management`)
- [x] `AdminLeaveApprovalsPage.tsx` (new) — admin leave approvals (Pending/History tabs, approve ConfirmDialog, reject modal with reason); loads all leaves via `leaveService.getAll()`
- [x] `AppRouter.tsx` — `leave/approvals` route under admin layout
- [x] `AdminSidebar.tsx` — "Approvals" nav group (Leave → `/leave/approvals`, Corrections → `/attendance/corrections`), expanded by default

---

## Session 2026-09-16 (cont.): Forgot-Password OTP — live smoke COMPLETE

> Backend `node dist/main` on :3001 already included the OTP code; full flow verified against the live API (user rahul@attendflow.in, demo password restored after).

### Completed (2026-09-16)
- [x] forgot-password existing email → 200 generic message; immediate repeat → 429 `RATE_LIMITED` `waitSeconds`; non-existing email → 200 identical generic message (no enumeration leak)
- [x] verify-otp wrong OTP → 400 `OTP_INVALID` with `remainingAttempts` countdown (3→2→1)
- [x] Happy path driven via `prisma db execute`: replaced the live row's `otpHash` with sha256 of a known 6-digit code (real OTP unreachable locally — hashed + only in dev-console fallback) → verify-otp 200 (no consumption), reset-password 200, old password login 401, **pre-reset refresh token → 401 `UNAUTHENTICATED`** (revocation confirmed), OTP reuse after reset → 400 `OTP_INVALID` "already been used"
- [x] 5th wrong attempt → `OTP_ATTEMPTS_EXCEEDED` (row consumed); next attempt → "already been used"
- [x] Expiry path: row `expiresAt` rewound 1 min → 400 `OTP_EXPIRED`
- [x] Cleanup: rahul's `User.passwordHash` restored to the `password` seed hash (copied from priya@attendflow.in), all `PasswordResetOtp` rows for rahul deleted; temp body/sql files removed
- [ ] Real email delivery not confirmable locally — no `RESEND_API_KEY`; OTP falls back to the BE console log (`[DEV] Password reset OTP for …`)

---

---

## Session 2026-09-16 (cont.): Office Attendance dashboard chart (replace Department) — COMPLETE

> User: "remove Department Attendance and add office/shop Attendance in dashboard". The admin dashboard's "Department Attendance" bar chart was wired to `GET /dashboard/department-stats` which the backend does NOT expose (the real endpoint is `GET /dashboard/office-stats`, returning `{ office, total, present, absent, late }` per active office) — so the chart was broken. All frontend wiring renamed to Office stats; backend needed no code changes (endpoint already existed). Verified FE `npx tsc --noEmit` + `npm run build` exit 0; BE `npm run build` + `npm run lint` exit 0; live smoke (admin token) → office-stats returns Delhi/Mumbai/Bangalore rows.

### Completed (2026-09-16)
- [x] `src/services/http/endpoints.ts` — `API.dashboard.officeStats = "/dashboard/office-stats"` (was `departmentStats`/`department-stats`)
- [x] `src/services/api/report.api.ts` — `getDepartmentStats()` → `getOfficeStats(): Promise<OfficeStat[]>` hitting the corrected URL; import updated
- [x] `src/services/dashboard.service.ts` — `DepartmentStat` → `OfficeStat` (field `office` instead of `department`)
- [x] `src/pages/admin/AdminDashboardPage.tsx` — `departments` state → `offices`, `getOfficeStats()`, chart title → **"Office Attendance"**, `dataKey="office"`
- [x] `src/types/index.ts` — removed dead `DepartmentAttendance` interface
- [x] Backend `test/app.e2e-spec.ts` — dashboard block now expects `/api/v1/dashboard/office-stats` with `office` key (was `department-stats`/`department`); backend `memory-bank/07-api-specification.md` updated
- [x] **No backend code changes** — `DashboardService.getOfficeStats()` already existed

---

## Session 2026-09-14 (cont.): Add Employee Office/Manager UX — COMPLETE

> Verified FE `npx tsc --noEmit` + `npm run build` exit 0.

**Frontend** (`Attendance Management`)
- [x] `EmployeeFormPage.tsx` — reordered Employment fields: Role → Office → Designation → Reporting Manager → Shift → …
- [x] Role=**admin** hides Office field and clears `officeId` + `managerId` (same behavior as Reporting Manager clearing)
- [x] `officeId` schema changed to optional + `superRefine` requiring it when role ≠ admin; `EmployeeFormData.officeId` → optional in `types/index.ts`
- [x] Reporting Manager dropdown filtered by selected office via `visibleManagers` (no office = all managers); `managerId` cleared on office mismatch; full `officeId` stored in managers state from `Employee` objects

---

## Session 2026-09-14 (cont.): Fix Roles page selected permissions not rendering — COMPLETE

> Verified FE `npx tsc --noEmit` + `npm run build` exit 0.

**Frontend** (`Attendance Management`)
- [x] `src/services/api/rbac.api.ts` — `mapRole()` now normalizes backend role `id` (`'ADMIN'|'MANAGER'|'EMPLOYEE'`, uppercase Prisma enum) to FE `Role` via `toRole()` (lowercase). Previously matrix keys (`RolesPage`) were uppercase while table columns/`ROLE_LABELS`/`ACCESS_LEVEL` use lowercase enum values, so every granted cell rendered unchecked and toggles/save wrote to empty lowercase keys (would wipe backend grants). PATCH path params already uppercased server-side, so lowercase ids safe.

---

---
2. `ignoreDeprecations: "6.0"` needed in tsconfig for `baseUrl`/`paths`
3. Pages use hardcoded mock data inline (will be moved to `src/mocks/data/` + services in Phase 2+)
4. Route map (§11) not fully wired: /reset-password, /employees/:id/attendance + /leave (rendered as tabs on detail page instead of sub-routes), /settings/roles, /settings/permissions, /team*
