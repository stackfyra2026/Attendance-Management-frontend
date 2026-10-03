# AttendFlow — Components

## UI Components (`src/components/ui/`)

All UI components are in `src/components/ui/` and exported via barrel `index.ts`.

### Button
- **File**: `Button.tsx`
- **Props**: variant (primary/secondary/outline/ghost/danger/success), size (sm/md/lg), isLoading, fullWidth
- **Features**: Loading spinner, focus ring, active scale animation

### IconButton
- **File**: `IconButton.tsx`
- **Props**: variant, size (sm/md/lg), isLoading
- **Features**: Square button for icons only

### Input
- **File**: `Input.tsx`
- **Props**: label, error, hint, leftIcon, isPassword
- **Features**: Show/hide password toggle, inline validation, accessible
- **Known Issue**: TS error at line 35 with `leftIcon && "pl-10"`

### Select
- **File**: `Select.tsx`
- **Props**: label, error, hint, options, placeholder
- **Features**: Custom chevron, appearance-none styling

### Textarea
- **File**: `Textarea.tsx`
- **Props**: label, error, hint

### DatePicker / TimePicker
- **Files**: `DatePicker.tsx`, `TimePicker.tsx`
- **Props**: label, error
- **Features**: Native input with custom icon overlay

### Avatar
- **File**: `Avatar.tsx`
- **Props**: src, firstName, lastName, size (xs/sm/md/lg/xl), showStatus, status
- **Features**: Initials fallback from initials, status indicator

### Badge
- **File**: `Badge.tsx`
- **Props**: variant (default/primary/success/warning/danger/outline), size, icon
- **Features**: Rounded pill, icon support

### Card
- **File**: `Card.tsx`
- **Props**: padding (none/sm/md/lg), hover, onClick
- **Features**: Rounded-2xl, border, shadow-sm

### Modal
- **File**: `Modal.tsx`
- **Props**: isOpen, onClose, title, size, footer, closeOnOverlay
- **Features**: Escape key close, body scroll lock, overlay click

### BottomSheet
- **File**: `BottomSheet.tsx`
- **Props**: isOpen, onClose, title, footer, closeOnOverlay
- **Features**: Slides up from bottom on mobile, centered on sm+, drag handle

### Drawer
- **File**: `Drawer.tsx`
- **Props**: isOpen, onClose, title, side (left/right), footer

### Dropdown
- **File**: `Dropdown.tsx`
- **Props**: trigger, items, onSelect, align
- **Features**: Click outside to close, keyboard accessible

### Tabs
- **File**: `Tabs.tsx`
- **Props**: tabs (id/label/icon/count), activeTab, onChange
- **Features**: Scrollable, active indicator line

### Toast
- **File**: `Toast.tsx`
- **Exports**: ToastProvider, useToast
- **Types**: success, warning, error, info
- **Features**: Auto-dismiss after 3.5s, positioned top-right (desktop) / above bottom nav (mobile)

### ConfirmDialog
- **File**: `ConfirmDialog.tsx`
- **Props**: isOpen, onClose, onConfirm, title, message, confirmLabel, variant, isLoading

### DataTable
- **File**: `DataTable.tsx`
- **Props**: columns, data, keyExtractor, onRowClick, emptyMessage
- **Features**: Generic typed columns, render function per column

### Pagination
- **File**: `Pagination.tsx`
- **Props**: currentPage, totalPages, onPageChange
- **Features**: Ellipsis for large page counts

### Skeleton / SkeletonCard / SkeletonTable
- **File**: `Skeleton.tsx`
- **Features**: Pulse animation, text/circular/rectangular variants

### EmptyState / ErrorState
- **File**: `EmptyState.tsx`
- **Props**: icon, title, description, actionLabel, onAction

### StatCard
- **File**: `StatCard.tsx`
- **Props**: title, value, icon (LucideIcon), change, variant

## Layout Components (`src/components/layout/`)

### Brand
- `src/components/layout/Brand.tsx` — single source of truth for the app logo: renders `<Logo size="sm" />` (the `public/logo.svg` 24-hour-clock icon) + brand name. Props: `showName`, `nameClassName`, `markClassName`, `className`. Used by TopBar, AdminSidebar header, admin mobile header, and EmployeeLayout header.

### Logo (`src/components/ui/Logo.tsx`)
- Renders `/logo.svg` (Vite serves `public/` at the root). Props: `size` (sm `h-8 w-8` / md `h-10 w-10` / lg `h-14 w-14` / xl `h-16 w-16`), `className`, `alt` (default "Logo"). The SVG ships its own gradient rounded-rect background, so no wrapper box/bg color is used. Replaces the old "AF" text chips in `Brand`, `LoginPage`, and `ForgotPasswordPage`. `public/logo.svg` and `public/favicon.svg` are identical assets.

### AdminSidebar
- Static `navItems` (Dashboard, Employees ↓, Shifts, Locations, Holidays, Approvals ↓, Reports, Announcements, Notifications, Settings ↓); Attendance + Leave removed — personal self-service flows, admins reach them by switching role (RoleSwitcher). "Departments" nav item removed (Department feature removed from FE).
- **Approvals group** (`ClipboardCheck`): Leave → `/leave/approvals`, Corrections → `/attendance/corrections` (expanded by default with Employees + Settings)
- Collapsible navigation with nested groups (Employees, Settings); `h-16` header uses `Brand` (showName when expanded, logo-only when collapsed); collapse toggle on lg+
- Active state highlighting, responsive (hidden on mobile, shown on lg+)

### TopBar
- Theme toggle (light/dark/system), notifications bell, RoleSwitcher, user dropdown with avatar; brand block is a `Link` to `/admin/dashboard` using `Brand`; all icon buttons use `IconButton` (`ghost`/`xs`) or the shared nav-link button style with `title`/`aria-label` + focus ring
- Props: `homeTo` (default `/admin/dashboard`) and `settingsTo` (default `/settings`; omit to hide the Settings dropdown item) — ManagerLayout uses `<TopBar homeTo="/team" />`

### ManagerSidebar
- `src/components/layout/ManagerSidebar.tsx` — manager nav in two grouped sections: **Team** (Team `/team`, Employees `/team/employees`, Approvals ↓ Leave/Attendance) and **My Account** (Dashboard `/team/me`, Attendance `/team/me/attendance`, Monthly, Leave, Profile) — extracted `ManagerSidebarItem` renderer; same collapsed/expand behavior as AdminSidebar; bottom **Logout** row (danger, `logout` + navigate `/login` + close sidebar)

### ManagerLayout
- `src/app/layouts/ManagerLayout.tsx` — mirror of AdminLayout: fixed ManagerSidebar, desktop TopBar (`homeTo="/team"`, no Settings link), mobile hamburger header + overlay. No role switcher (single-role).

## Domain Components (§44) — Implemented (Phase 2)

### Attendance (`src/components/attendance/`)
- **AttendanceCard** — Today's attendance card: status, check-in/out times, working hours, office + distance, action button; gradient primary card on dashboard
- **AttendanceStatusBadge** — Status pill (Present/Late/Absent/Half Day/Leave/Holiday/Week Off/Incomplete); icon + text + color, never color alone
- **WorkingTimer** — Elapsed working-hours timer from timestamps + `useNow` (D13); freezes during active break; shows final value after check-out
- **BreakTimer** — Break duration value + Start/End Break control; `compact` prop for summary card inline button
- **CheckInFlow** — 3-step flow: LocationVerification sheet → submitting → success panel; auto-closes on success
- **CheckOutSheet** — Confirm sheet (check-in/current/working/break) → success summary (total working hours)
- **ManualAttendanceForm** (Session 2026-09-15) — inline Card "Record Check-In / Check-Out" form (replaces the old `ManualAttendanceModal`) for admin/manager corrections pages: Employee + Date + Check-in/Check-out TimePickers + Status select (auto/present/late/absent/half-day) + optional Reason. Same RHF+Zod schema (refines: ≥1 of in/out/status; check-out needs check-in; check-out > check-in). Submits via `attendanceService.manualPunch` → toast + `onRecorded()`. Props: `employeeOptions`, `onRecorded`. Used by admin `CorrectionsPage` (all employees) and manager `TeamApprovalsAttendancePage` (direct reports). Manual punches do NOT create a `CorrectionRequest`, so they don't appear in the History tab.
- **DirectCorrectionForm** (Session 2026-09-15) — inline Card "Apply Attendance Correction" form for the **Corrections** tab on admin/manager pages. Employee + Date selects auto-preview the existing record via `attendanceService.getHistory(employeeId, {from,to})` (preview panel: current check-in/out/worked/status, or "no record — will create"); edit fields are pre-filled from that record; required reason (5–500). Submits via `attendanceService.applyDirectCorrection` → `POST /attendance/corrections/direct`, which applies to attendance AND creates an `APPROVED` `CorrectionRequest` (so it shows in History). Props: `employeeOptions`, `onRecorded`.

### Location (`src/components/location/`)
- **LocationVerification** — 7 states (§17): checking, verified, outside, permission denied, unavailable, low accuracy, error. Shows icon, message, distance, allowed radius, accuracy, action buttons. Continue passes the **actual captured** position
- **LocationStatus** — Compact inline location/distance indicator (e.g., "Delhi Office · 342m away") — **not yet created** (Phase 2 shows distance inline in AttendanceCard)

### Employee (`src/components/employee/`)
- **EmployeeCard** — Mobile card presentation of an employee row
- **EmployeeAvatar** — Avatar + name + ID + status composition
- **EmployeeStatus** — Active/Inactive/On-Leave indicator
- **EmployeeSummary** — Compact summary (attendance, leave balance) used on detail page

### Leave (`src/components/leave/`)
- **LeaveStatusBadge** — Pending/Approved/Rejected/Cancelled pill; icon + text + color, labels from `LEAVE_STATUS_LABELS`
- **LeaveCard** — Leave request/history item (type, dates, days, status) — pending (§23 phase 4 done in page; card extraction optional)
- **LeaveBalance** — Balance card with progress bar (e.g., Casual Leave 10/12) + used/pending — rendered inline on LeavePage

### Maps (`src/components/`)
- **GoogleMap** (§38) — Isolated Maps component: office marker, current employee location, distance, radius visualization, location selection. Clean fallback when no API key / unavailable.

### Notification (`src/components/notifications/`)
- Notification item rendered inline on NotificationsPage (tap-to-read, type label, unread dot); loading skeleton + empty state (`SkeletonCard`/`EmptyState`) — Phase 5 complete; dedicated notification item component still optional

## Admin Dashboard (Phase 6)
- **Page**: `AdminDashboardPage` — 6 `StatCard` KPIs from `dashboardService.getOverview`, Recharts `AreaChart` (14-day present/absent trend with gradient fills) + stacked `BarChart` (department present/late/absent), recent check-ins list reusing `AttendanceStatusBadge`; loading skeletons + `ErrorState` retry
- **Data**: `src/mocks/data/dashboard.ts` `buildOrgAttendance(14)` — deterministic seeded per-employee daily statuses; `src/services/dashboard.service.ts` aggregates; colors via `themeColor()` helper (theme-aware, no hardcoded hex in component)

## Employee Management (Phase 7)
- **`EmployeesPage`** (`/employees`) — search + status/role filter selects, desktop table + mobile cards, view (`/employees/:id`), edit, activate/deactivate via `ConfirmDialog`, `Pagination`, `SkeletonTable`/empty/retry states (Department filter + column removed)
- **`EmployeeFormPage`** (`/employees/new`, `/employees/:id/edit`) — RHF + Zod form (personal, employment, role, account status); Role `<Select>` is the first field in the Employment section; Reporting Manager options are filtered to MANAGER-role employees only (via `employeeService.getAll({ role: "manager" })`); when Role = Admin, Reporting Manager is hidden and `managerId` is cleared automatically via `useWatch`; surfaces `initialPassword` on create (real mode only, one-time banner + "Go to Employees")
- **`EmployeeDetailPage`** (`/employees/:id`) — header card with status/role/office, 3 tabs: Overview (`InfoRow` dl), Attendance (monthly summary `SummaryStat` + recent days with `AttendanceStatusBadge`), Leave (balance bars + history with `LeaveStatusBadge`); edit + deactivate actions

## Org CRUD + Corrections (Phase 8)
- **`DepartmentsPage`** — stubbed to `return null` with a preserve-for-restore comment; route removed from `AppRouter`; department service file kept for optional future restore
- **`DesignationsPage`** — designation cards (level, description only; department column removed), RHF modal add/edit (name/description/level; no department Select), activate/deactivate
- **`TeamsPage`** — team cards (manager, member avatar stack; department subtitle removed), create-modal (name/manager; no department), Manage modal with manager-switch + add/remove members
- **`CorrectionsPage`** (`/attendance/corrections`) — Tabs **Check-In/Out** (inline `ManualAttendanceForm`, all employees) / **Corrections** (inline `DirectCorrectionForm`, all employees) / **History** (read-only list of all `CorrectionRequest` with status badge); no approval flow (approve/reject, Pending tab, "New Correction" request modal, `ConfirmDialog` all removed per user request — corrections are direct, including `POST /attendance/corrections/direct` which records approved history)

## Shifts · Locations · Holidays (Phase 9)
- **`src/components/maps/GoogleMap.tsx`** — `useJsApiLoader` from `@react-google-maps/api`; props `center {lat,lng}`, `radiusMeters?`, `label?`, `onSelect?`, `height?` (default 280); marker + primary-colored geofence `Circle`; click-to-select; fallback panel when key missing/load error
- **`ShiftsPage`** — shift cards (12h times, overnight-aware duration, grace/late/break/min-hours stats), RHF CRUD modal (TimePickers + number fields), enable/disable
- **`LocationsPage`** — office cards (lat/lng/radius 5-dp, timezone), RHF CRUD modal (lat/lng/radius + embedded `GoogleMap` click-picker via `setValue`), enable/disable
- **`HolidaysPage`** — holiday cards (date + weekday via date-fns, type badge with `typeVariant`, Recurring badge), RHF CRUD modal (DatePicker/type Select/recurring checkbox), delete via `ConfirmDialog`

## Reports + Import (Phase 10)
- **`ReportsPage`** — 6 report tabs (Attendance/Monthly/Late/Absent/Leave/Overtime); filters: date range (or month input) + office/employee/status selects (Department filter removed); Office column across all report types; StatCard summary grid; responsive table (`AttendanceStatusBadge`, 12h check times via date-fns) + CSV export (guards text values that merely contain "T" from being parsed as dates); loading skeleton / empty / error/retry states
- **`ImportPage`** (`/employees/import`) — 3-step wizard (Upload → Review → Done): drag/drop + browse CSV input, template download (12 columns — Department column removed), in-page CSV parser, validation with per-row issues list (required fields, dup email/ID vs store + batch, name→id resolution for designation/team/office/shift/manager; department optional), valid-row preview table, summary chips (Total/Valid/Issues), final result screen with skipped rows + actions

## Roles & Permissions + Announcements (Phase 11)
- **`src/hooks/usePermission.ts`** — sync hook wrapping `permissionService.hasPermission` for the current auth role; defaults to Employee when role absent
- **`RolesPage`** (`/settings/roles`) — role summary cards (shield icon + access-level badge + permission count) + full permission matrix table grouped by module; Admin column read-only/full-access with toggle-all-per-module; editable Manager/Employee columns; async save with toast
- **`PermissionsPage`** (`/settings/permissions`) — read-only permission catalogue grouped by module, each card showing name + description + permission ID code
- **`SettingsPage`** — simplified hub linking to `/settings/roles`, `/settings/permissions`, `/announcements`, `/teams`
- **`AnnouncementsPage`** — announcement list with live/expired/upcoming status badge + priority badge; create/edit modal (RHF+Zod: title, description, priority select, date range with `endDate ≥ startDate` refine); delete `ConfirmDialog`; New/Edit/Delete buttons gated by `usePermission("announcements.manage")`
- **`EmployeesPage`** — Add/Edit/Deactivate buttons gated by `usePermission("employees.create"/"employees.edit"/"employees.deactivate")` on both desktop table and mobile cards
- **`ReportsPage`** — Export CSV button gated by `usePermission("reports.export")`
- **`TopBar`** — Profile → `/profile`; Settings → `/settings`; Logout via `window.location`. Roles are now Admin/Manager/Employee only (HR removed).

## Single-Role (Phase 12 reverse)
- **`src/utils/roles.ts`** — only `homeForRole(role)` remains → Admin `/admin/dashboard`, Manager `/team`, else `/dashboard`; `getEmployeeRoles` removed
- `RoleSelectPage` (`/select-role`) and `RoleSwitcher` deleted — every user has exactly one role, no role switching UI

## Manager Module (Phase 13)
- **`ManagerLayout`** `/team/*` — admin-style shell (see Layout Components); `RoleRoute allowedRoles={[Role.MANAGER]}`; `homeForRole(MANAGER)` lands here
- **`AdminLeaveApprovalsPage`** (`/leave/approvals`, ADMIN) — admin leave approvals mirroring `TeamApprovalsLeavePage`: Pending/History tabs, approve via `ConfirmDialog`, reject via modal with required reason; loads ALL leaves via `leaveService.getAll()` (no team filter); employee name/ID, dates, leave-type badge, days, reason per card
- **`TeamOverviewPage`** (`/team`) — 6 StatCards: Team Size / Present Today / Late Today / Absent Today / On Leave Today / Pending Leave (from `employeeService.getAll({ manager })` + `leaveService.getAll`, team-scoped; Pending Approvals stat removed with the corrections approval workflow) + direct-reports list
- **`TeamEmployeesPage`** (`/team/employees`) — report cards (avatar, designation, account-status badge, office/joining/email grid; department removed)
- **`TeamApprovalsLeavePage`** (`/team/approvals/leave`) — Pending/History tabs; pending cards (avatar, date range, type badge, days, reason) → Approve (`ConfirmDialog`) / Reject (modal with required reason `Textarea`); uses `leaveService.approve/reject(id, user.id)`
- **`TeamApprovalsAttendancePage`** (`/team/approvals/attendance`) — heading "Attendance Corrections"; Tabs **Check-In/Out** (inline `ManualAttendanceForm`, direct reports only) / **Corrections** (inline `DirectCorrectionForm`, direct reports only) / **History** (read-only team corrections with status badge); approval flow removed (direct corrections, no approval)
- **Manager self-service** — employee flows mounted inside the manager shell at `/team/me/*` (Dashboard, Check In/Out `/team/me/attendance`, Monthly, Leave + Apply, Profile) so managers check in/out without switching roles; `LeavePage`/`ApplyLeavePage` sibling links are base-aware (`/team/me` prefix when under `/team`, else `/`); `ProfilePage` has a full-width Logout button (`logout` + navigate `/login`)
- Manager role now defaults to include `attendance.review` permission (approve/reject team corrections)
- **`LoginPage`** — email + password only; 3 quick-fill demo presets (Rahul/Employee, Priya/Manager, Vikram/Admin); redirects to `homeForRole(user.role)` after login
- **`NotificationsPage`** (shared) — rendered at `/notifications` (employee), `/admin/notifications` (admin, via `AdminNotificationsGate` redirect), and `/team/me/notifications` (manager, gate redirects MANAGER there too); `AdminSidebar` item + `TopBar` bell point admins to `/admin/notifications`, `ManagerSidebar` item + `ManagerLayout` bell (`notificationsTo="/team/me/notifications"`) point managers to `/team/me/notifications`

## 3-Month Attendance History + Attendance Visibility (Session 2026-09-15)
- **`AttendanceMonthView`** (`src/components/attendance/AttendanceMonthView.tsx`, NEW) — reusable month navigator: prev/next month buttons, 6-stat card grid, Monday-start calendar grid with per-day status dot + legend, optional day list. Props: `employeeId`, `initialMonth?` (default current), `showDayList?`. Data via `attendanceService.getMonthly`; group/calendar formatters + `EMPTY_SUMMARY` from `attendanceService`. Used by `MonthlyAttendancePage` (showDayList), `EmployeeDetailPage` Attendance tab (showDayList), and `AttendancePage` "This Month" tab (client-filtered month paging over full history).
- **`AttendancePage`** ("This Month" tab) — month-state + prev/next navigation; month summary via `getMonthly`, plus per-month day list; full history remains the data source for Today/This Week tabs
- **`EmployeesPage`** — `AttendanceCell` (inline helper component, table + mobile): today `AttendanceStatusBadge` / "—", month `P n · L n · A n`, month key + attendance % ((P+L)/(P+L+A)); page fetch sends `statsMonth`
- **`TeamEmployeesPage`** — `AttendanceStatsRow` (inline helper) on each report card: today badge, month key, colored P/L/A counts + %; `employeeService.getAll` now passes `statsMonth`; card CTA → `/team/employees/:id` detail page. (Team monthly-summary "Download Attendance" button removed 2026-09-15 — downloads live only in the Reports section `/team/reports`)
- **`TeamOverviewPage`** — 6-card stat grid: Team Size / Present Today (today status present|late) / **Late Today** (status `late`) / **Absent Today** (status `absent`) / On Leave Today (status `leave`) / Pending Leave; `grid-cols-2 sm:grid-cols-3 xl:grid-cols-6`; loads team with `statsMonth`
- **`ManagerReportsPage`** (`/team/reports`) — thin wrapper around admin `ReportsPage`; backend scopes every report + employee dropdown to the manager's direct reports; CSV export button shown for MANAGER via `reports.export` — requires the permission in BOTH the backend DB (`rbac.constants` + live grant) AND the FE `DEFAULT_PERMISSIONS` fallback (managers never load backend roles, `/rbac/roles` is ADMIN-only)
- **Derived today status (backend `getTodayStatuses`)** — drives `AttendanceCell`/`AttendanceStatsRow` today badges + manager cards: existing attendance record → lowercased status + checkIn; else approved leave today → `leave`; else Sunday/holiday → `null` ("—"); else → `absent` (immediate). No frontend cell changes were needed

## FCM Push Notifications (Session 2026-09-15)
- **`src/config/firebase.ts`** (NEW) — `firebaseConfig` from `VITE_FIREBASE_*` (apiKey/authDomain/projectId/storageBucket/messagingSenderId/appId/**vapidKey**), `isFirebaseConfigured()` (needs apiKey+messagingSenderId+projectId), `isPushAllowedFor(user)`. Unconfigured → hard no-op, in-app notifications only.
- **`src/services/fcm/fcm.service.ts`** (NEW) — module-level singleton: `init(): FcmInitResult` (guards `isSupported()` + `Notification.requestPermission` → `getToken({ messagingServiceWorkerRegistration, vapidKey })` → backend `registerDeviceToken`), `stop()` (backend revoke + `deleteToken`), `onMessage(cb)` returns unsubscribe. SW registered as `/firebase-messaging-sw.js?config={json}` because a `public/` file cannot read `import.meta.env`.
- **`src/services/fcm/useFcmPush.tsx`** (NEW) — `FcmPushProvider` mounted in `main.tsx` inside `<Provider>`/outside router. On authenticated-user change: `init()`, then foreground `onMessage` → map payload (`data.type/link/id` + `notification.title/body`) → `dispatch(addNotification(...))`. Cleanup revokes backend token + `deleteToken` + unsubscribes + clears the wired-user ref (re-login re-wires; token is per-user). `Notification.requestPermission` fires once per origin, silently resolves `granted` thereafter.
- **`public/firebase-messaging-sw.js`** (NEW) — compat SDK (`importScripts` 10.14.1). Reads config from `?config=` query param; `onBackgroundMessage` → `showNotification(title, { body, icon:/favicon.svg, data:{url: link||'/notifications'} })`; `notificationclick` focuses an existing window (navigating to `data.url`) or opens a new one. Init guarded so an unconfigured/parse-failed config never crashes the SW.
- **`src/services/http/request.ts`** — `delWithBody<T>(url, data?)` for the DELETE-with-body revoke endpoint (plain `del` sends no payload).
- **Backend counterparts** — `PushModule` (@Global) + `FcmService` (`Attendance Management-backend/src/modules/push/`), `NotificationsService.notify()/registerDeviceToken()/revokeDeviceToken()`, `LeavesService` approve/reject + `AnnouncementsService.fanOut` routed through `notify()`, `POST`/`DELETE /notifications/device-token` endpoints.
- **Attendance/leave event notifications (backend, Session 2026-09-15)** — `AttendanceService` (imports `NotificationsModule`): check-in/out → user + direct manager pairs (`Checked in`/`Team check-in`, `Checked out · worked <x>`/`Team check-out`, `Early checkout alert` for both when checkout < `endTime − earlyCheckoutMinutes`; `manager` relation selected via `getEmployee`, `notifyManager()` skips none/self). `LeavesService.apply()` → direct manager `New leave request` (LEAVE, `/team/approvals/leave`). `AttendanceReminderService` (`@nestjs/schedule` `@Cron('*/15 * * * *')`, Asia/Kolkata, provider in `AttendanceModule`): checkout reminders for open records + missed-check-in for no-shows on ended non-overnight shifts; Sundays/holidays skipped; in-memory `${employeeId}:${dateKey}:checkout|noshow` dedupe (resets daily). No FE component changes (labels/handlers already cover ATTENDANCE/LEAVE).
