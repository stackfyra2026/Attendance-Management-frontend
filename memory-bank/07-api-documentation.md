# AttendFlow — API / Service Documentation

## Status
**Real backend only.** All services in `src/services/*.service.ts` (flat, §45/D8) re-export their corresponding `src/services/api/*.api.ts` modules. The `src/mocks/` directory has been deleted and `config.useMockApi` no longer exists.
The backend lives in `Attendance Management-backend` (NestJS + Prisma + SQLite, port 3001, prefix `api/v1`).

This document is a **living contract**: keep signatures in sync with `src/services/` and `src/types/`.

**Implemented so far (Phases 2–11 + Sessions 2026-09-14/15/16):** `location.service.ts`, `location-office.service.ts` (getAll/getById/create/update/setActive), `employee.service.ts` (getAll(含 role filter)/getById/getByEmployeeId/getByLoginEmail/getProfile/create/update/setActive/importCsv), `attendance.service.ts` (checkIn/checkOut/endBreak/getToday/getHistory/getMonthly/getCorrectionRecords/getCorrections/requestCorrection/approveCorrection/rejectCorrection), `shift.service.ts` (getAll/getById/create/update/setActive + `isWithinShiftWindow`/`getShiftDuration`/`formatShiftDuration`/`formatTime12h`/`shiftToForm`), `announcement.service.ts` (getActive/getAll/create/update/remove), `leave.service.ts` (getBalance/getHistory/getAll/apply/cancel/approve/reject), `notification.service.ts` (getAll/markAsRead/markAllAsRead/getUnreadCount/**registerDeviceToken/revokeDeviceToken — FCM push, §12b**), `dashboard.service.ts` (getOverview/getAttendanceTrend/**getOfficeStats**/getRecentCheckIns), `department.service.ts` (getAll/create/update/setActive), `designation.service.ts` (getAll/create/update/setActive), `team.service.ts` (getAll/getById/create/updateManager/addMembers/removeMember), `holiday.service.ts` (getAll/create/update/remove), `report.service.ts` (getAttendanceReport/getMonthlySummary/getLateReport/getAbsentReport/getLeaveReport/getOvertimeReport/exportCsv), **`permission.service.ts` (getPermissions/getRoles/updateRolePermissions/hasPermission — backed by `GET/PATCH /rbac/*`)**, **auth password reset (forgotPassword/verifyOtp/resetPassword — §1b, Session 2026-09-16)**.

## Dashboard Service (d3, Phase 6)
Reads deterministic org-wide mock data (`src/mocks/data/dashboard.ts` `buildOrgAttendance(14)`).
| Method | Params | Returns |
|--------|--------|---------|
| `getOverview()` | — | `{ totalEmployees, presentToday, absentToday, lateToday, onLeaveToday, attendanceRate, trendDelta }` |
| `getAttendanceTrend(days?)` | days?: number | `TrendPoint[]` `{ date, label, present, absent, late, onLeave, rate }` |
| `getOfficeStats()` | — | `OfficeStat[]` `{ office, total, present, absent, late }[]` (today) — `GET /dashboard/office-stats` |
| `getRecentCheckIns(limit?)` | limit?: number | `{ id, name, designation, time, status }[]` sorted by check-in time desc |

## Switching
```ts
// src/services/index.ts (to be created in Phase 2)
import { config } from "@/config";
const useMock = config.useMockApi; // VITE_USE_MOCK_API
// Each service file internally branches: mock module vs real Axios module.
```

## Shared Types (src/types/)
User, Employee, EmployeeFormData, ImportRow, Department, Designation, Team, OfficeLocation, OfficeFormData, Shift, ShiftFormData, Holiday, HolidayFormData, Attendance, AttendanceLocation, CorrectionRequest, Leave, LeaveType, Holiday, Notification, Announcement, AnnouncementFormData, Role, Permission, Role_, AuditLog. No `any`.

---

## 1. Auth (authSlice — replaces auth.service)
*Auth is handled by the Redux slice `authSlice`; no service wrapper exists. Demo password is `password` for all accounts.*
| Method | Params | Returns |
|--------|--------|---------|
| `loginUser` (thunk) ✅ | `{ email, password }` | `{ user, token }` or rejects (`Invalid email or password`, `No account found with this email`, `This account has been deactivated`) — resolves employee via `employeeService.getByLoginEmail`; `user.role` comes from the employee's single role |
| `logout()` ✅ reducer | — | clears user/token |
| `forgotPassword(email)` ✅ (Session 2026-09-16) | email | — `POST /auth/forgot-password` |
| `verifyOtp(email, otp)` ✅ (Session 2026-09-16) | email, 6-digit otp | — `POST /auth/verify-otp` |
| `resetPassword(email, otp, newPassword)` ✅ (Session 2026-09-16) | email, otp, newPassword (6–128) | — `POST /auth/reset-password` |

## 1b. Backend Password-Reset API (Session 2026-09-16, `Attendance Management-backend`)
| Endpoint | Guard | Request | Response (`data`) / errors |
|----------|-------|---------|------------------------------|
| `POST /auth/forgot-password` | public | `{ email }` | `{ message }` — **anti-enumeration**: identical generic success for existing/non-existing email; inactive users get no email. New OTP (sha256-hashed, `otpLength` 6, `otpTtlMinutes` 10 expiry, `otpMaxAttempts` 5) invalidates previous ones; 60s `resendCooldownSeconds` → 429 `RATE_LIMITED` `{ waitSeconds }`; email sent via Resend (dev fallback logs OTP to console when apiKey unset/send fails — never in production). Audit `forgot_password` |
| `POST /auth/verify-otp` | public | `{ email, otp }` | `{ message }` — validates WITHOUT consuming. Errors: `OTP_INVALID` (or no code exists), `OTP_EXPIRED`, `OTP_ATTEMPTS_EXCEEDED` (OTP consumed on 5th mismatch) |
| `POST /auth/reset-password` | public | `{ email, otp, newPassword }` | `{ message }` — consumes OTP, hashes + saves new password (argon2), marks OTP used, **revokes ALL refresh tokens**, audit `password_reset`. Same OTP_* errors (consumption checked before saving) |

OTP storage: `PasswordResetOtp` rows (Prisma), hash via `CryptoUtil.sha256`, lookup by `(userId, otpHash)` with `usedAt = null` and `expiresAt > now`. Email delivery: `MailService` (`src/modules/mail/`), Resend SDK, `from` default `AttendFlow <no-reply@attendflow.in>` (env `RESEND_FROM_EMAIL`).

## 2. employee.service.ts
*33 mock employees (§46) backed by an in-memory mutable store; CRUD implemented (Phase 7), import (Phase 10). Real backend `Employee` includes optional `attendanceStats`.*
| Method | Params | Returns |
|--------|--------|---------|
| `getAll(filters?)` ✅ | `{ search?, department?, team?, office?, manager?, employmentStatus?, page?, pageSize?, role?, statsMonth? }` | `{ items: Employee[], total, page, pageSize }` (name-sorted, relations populated). `statsMonth` (yyyy-MM) makes the backend attach `attendanceStats { month, present, late, absent, leave, workingHours, today: { status, checkIn } \| null }` to each row; empty month = no stats key |
| `getById(id)` ✅ | id: string | `Employee \| null` (relations populated) |
| `getByEmployeeId/` `getByLoginEmail` ✅ | employeeId / email | `Employee \| null` |
| `getProfile(employeeId)` ✅ | employeeId | `Employee \| null` (relations populated) |
| `create(data)` ✅ | EmployeeFormData | `Employee` (auto `EMP####`, rejects duplicate email) |
| `update(id, data)` ✅ | id, Partial\<EmployeeFormData\> | `Employee` (rejects duplicate email) |
| `setActive(id, active)` ✅ | id, boolean | `Employee` |
| `importCsv(rows)` ✅ | `ImportRow[]` (12-col CSV; `departmentId` optional/absent — maps to null) | `{ imported, skipped, errors: { row, message }[] }` (validates required fields + duplicate emails vs store/batch; auto `EMP####` when blank) |
| `getAttendance(employeeId, range?)` | employeeId, `{ from, to }` | `Attendance[]` (spec — not implemented) |
| `getLeaveBalance(employeeId)` | employeeId | `LeaveBalance[]` (spec — not implemented) |

## 3. attendance.service.ts
| Method | Params | Returns |
|--------|--------|---------|
| `checkIn(payload)` | `{ employeeId, officeId, location: AttendanceLocation, timestamp }` | `Attendance` — mock REJECTS if outside radius (simulates backend final validation, §64) |
| `checkOut(payload)` | `{ attendanceId, location?, timestamp }` | `Attendance` |
| `startBreak(payload)` | `{ attendanceId, timestamp }` | `Attendance` |
| `endBreak(payload)` | `{ attendanceId, timestamp }` | `Attendance` |
| `getToday(employeeId)` | employeeId | `Attendance \| null` |
| `getHistory(employeeId, range?)` | `{ from?, to? }` (yyyy-MM-dd) | `Attendance[]` — backend `GET /attendance/history` supports optional `from`/`to`; ranges are inclusive. Manager viewers are restricted to own + direct reports (403 cross-team) |
| `getMonthly(employeeId, month)` | month: YYYY-MM | `{ days: Record<date, Attendance \| undefined>, summary }` |
| `getCorrectionRecords()` ✅ | — | `Attendance[]` (14-day org-wide, employee populated) |
| `getCorrections(status?)` ✅ | status?: pending/approved/rejected | `CorrectionRequest[]` (employee populated). Role-scoped: ADMIN → all; MANAGER → direct reports' + own; EMPLOYEE → own only |
| `requestCorrection(payload)` ✅ | `{ attendanceId, employeeId, date, changes: { checkIn?, checkOut?, status? }, reason, requestedBy }` | `CorrectionRequest` (throws if no change) |
| `approveCorrection(id, reviewerId)` ✅ | id | `CorrectionRequest` (applies changes to record). MANAGER only for direct reports' requests; ADMIN for any PENDING request |
| `rejectCorrection(id, reviewerId, reason?)` ✅ | id | `CorrectionRequest` — same role/direct-report rule; final (no override) |
| `applyDirectCorrection(payload)` ✅ (Session 2026-09-15) | `{ employeeId, date, checkIn?, checkOut?, status?, reason (required 5–500) }` | `CorrectionRequest` — `POST /attendance/corrections/direct` (ADMIN/MANAGER + `attendance.review`). In ONE transaction: updates-or-creates the attendance record for `(employeeId, date)` AND creates a `CorrectionRequest` with `status: APPROVED` (`requestedBy`/`reviewerId` = actor, `reviewedAt` = now, `original*` from pre-apply record, `INCOMPLETE` when none) → the applied correction appears in the History tab. MANAGER restricted to direct reports (403 otherwise) |
| `correct(id, correction)` ✅ | `{ checkIn?, checkOut?, status?, reason (required), correctiveBy }` | `Attendance` — via corrections engine: `requestCorrection` (pending) → `approveCorrection` applies / `rejectCorrection`; `getCorrectionRecords` lists correctable org-wide records; `getCorrections(status?)` lists requests |

## 4. location.service.ts (geolocation wrapper, §15)
| Method | Params | Returns |
|--------|--------|---------|
| `getCurrentPosition()` | `{ enableHighAccuracy = true, timeout = 10000 }` | `Promise<{ latitude: number; longitude: number; accuracy: number }>` — wraps `navigator.geolocation.getCurrentPosition`; rejects with typed error (permission-denied / unavailable / timeout) |

## 5. leave.service.ts
| Method | Params | Returns |
|--------|--------|---------|
| `getBalance(employeeId)` | employeeId | `LeaveBalance[]` (Casual/Sick/Earned with used + total) |
| `getHistory(employeeId)` | employeeId | `LeaveRequest[]` |
| `getAll()` | — | Role-scoped: ADMIN → ALL requests; MANAGER → direct reports' + own; EMPLOYEE → own only. Admin uses this for the `/leave/approvals` page; manager page client-filters to direct reports. |
| `apply(data)` | `{ type, startDate, endDate, reason, attachment? }` | `LeaveRequest` (status Pending) |
| `approve(id, approverId)` | id | `LeaveRequest` — ADMIN allowed on any PENDING request; MANAGER only when the request owner is a direct report (else 403) |
| `reject(id, approverId, reason)` | id | `LeaveRequest` — same role/direct-report rule as approve; reject is final (no override) |
| `cancel(id)` | id | `LeaveRequest` |

## 6. department.service.ts
| Method | Params | Returns |
|--------|--------|---------|
| `getAll()` ✅ | — | `Department[]` (live employeeCount, populated manager) |
| `create(data)` ✅ | `{ name, description?, managerId? }` | `Department` (rejects duplicate name) |
| `update(id, data)` ✅ | id, Partial | `Department` |
| `setActive(id, active)` ✅ | id, boolean | `Department` |

## 7. designation.service.ts
| Method | Params | Returns |
|--------|--------|---------|
| `getAll()` ✅ | — | `Designation[]` (populated department when present) |
| `create(data)` ✅ | `{ name, departmentId?, level?, description? }` | `Designation` (rejects duplicate name; `departmentId` now optional) |
| `update(id, data)` ✅ | id | `Designation` |
| `setActive(id, active)` ✅ | id, boolean | `Designation` |

## 8. team.service.ts
| Method | Params | Returns |
|--------|--------|---------|
| `getAll()` ✅ | — | `Team[]` (populated manager/members, live memberCount; `department` present when set) |
| `getById(id)` ✅ | id | `Team \| null` |
| `create(data)` ✅ | `{ name, departmentId?, managerId }` | `Team` (rejects duplicate name; `departmentId` now optional) |
| `updateManager(id, managerId)` ✅ | id | `Team` |
| `addMembers(id, employeeIds)` ✅ | id, string[] | `Team` (dedup, excludes manager) |
| `removeMember(id, employeeId)` ✅ | id | `Team` |

## 9. shift.service.ts
| Method | Params | Returns |
|--------|--------|---------|
| `getAll()` ✅ | — | `Shift[]` |
| `getById(id)` ✅ | id | `Shift \| null` |
| `create(data)` ✅ | `ShiftFormData` (start/end, grace, late threshold, early checkout, min hours, break duration) | `Shift` (rejects duplicate name) |
| `update(id, data)` ✅ | id | `Shift` (rejects duplicate name) |
| `setActive(id, isActive)` ✅ | id, boolean | `Shift` |
| helpers ✅ | — | `formatTime12h`, `formatShiftDuration` (overnight-aware), `shiftToForm` |

## 10. location-office.service.ts
| Method | Params | Returns |
|--------|--------|---------|
| `getAll()` ✅ | — | `OfficeLocation[]` |
| `getById(id)` ✅ | id | `OfficeLocation \| null` |
| `create(data)` ✅ | `OfficeFormData` (radius ≥ 50m, default timezone Asia/Kolkata) | `OfficeLocation` (rejects duplicate name) |
| `update(id, data)` ✅ | id | `OfficeLocation` |
| `setActive(id, active)` ✅ | id, boolean | `OfficeLocation` |

## 11. holiday.service.ts
| Method | Params | Returns |
|--------|--------|---------|
| `getAll()` ✅ | — | `Holiday[]` (date-sorted) |
| `create(data)` ✅ | `HolidayFormData` | `Holiday` (rejects duplicate name) |
| `update(id, data)` ✅ | id | `Holiday` |
| `remove(id)` ✅ | id | `void` |

## 12. notification.service.ts
| Method | Params | Returns |
|--------|--------|---------|
| `getAll(userId)` | userId | `Notification[]` |
| `markAsRead(id)` | id | `Notification` |
| `markAllAsRead(userId)` | userId | `Notification[]` |
| `getUnreadCount(userId)` | userId | `number` |
| `registerDeviceToken(token, platform = "web")` | FCM registration token | `{ registered: boolean }` |
| `revokeDeviceToken(token)` | FCM registration token | `{ revoked: boolean }` |

## 12b. FCM Push notifications (Session 2026-09-15)
**Backend** (`Attendance Management-backend`)
| Endpoint | Guard | Request | Response (`data`) |
|----------|-------|---------|-------------------|
| `POST /notifications/device-token` | `@Roles('ADMIN','MANAGER','EMPLOYEE')` | `{ token: string (≥10), platform?: string }` | `{ registered: true }` — upsert by token (reassigning to new owner resets `platform`) |
| `DELETE /notifications/device-token` | all roles | `{ token }` (body! — requires `delWithBody`) | `{ revoked: true }` (idempotent; deletes only rows owned by the caller) |

- `NotificationsService.notify({ userIds, title, message, type, link })` — single transaction: `notification.createMany` (in-app, always) + queries `FcmToken` for those users + `FcmService.send` (FCM multicast; skipped when push disabled). Errors are caught/logged — **in-app path never breaks**.
- **Push scope (Session 2026-09-15, event notifications)**: leave **approved** (requester), leave **rejected** (requester), **announcement published** (`AnnouncementsService.fanOut` → all active employees). Plus attendance/leave events routed through `notify()`: check-in → user `Checked in` + manager `Team check-in` (naming employee); check-out → `Checked out · worked <x>` + `Team check-out`; early checkout (`checkout < shift.endTime − earlyCheckoutMinutes`) → `Early checkout alert` for user + manager; leave **apply** → direct manager `New leave request / <Name> (<EMP####>) applied for <type> leave <start> to <end> (<n> days)` (LEAVE, `/team/approvals/leave`). Scheduled `AttendanceReminderService` (`@nestjs/schedule`, every 15 min): open records on ended non-overnight shifts → `Reminder: check out`; active shift employees with no record today → `Missed check-in`; Sundays + holidays skipped; in-memory per-day dedupe.
- `FcmService` init is gated on `PUSH_ENABLED=true` + `FIREBASE_SERVICE_ACCOUNT` (JSON or file path; falls back to `applicationDefault()`). `send` prunes `messaging/registration-token-not-registered` / `messaging/invalid-registration-token` rows and bumps `lastUsedAt`.
- **Frontend**: `fcmService.init()` → `POST registerDeviceToken`; `fcmService.stop()` → `DELETE revokeDeviceToken`. `FcmPushProvider` (`main.tsx`) auto-registers after login and revokes on logout.

## 13. report.service.ts
| Method | Params | Returns |
|--------|--------|---------|
| `getAttendanceReport(filter)` ✅ | `{ from, to, office?, employee?, status? }` | `AttendanceReportRow[]` (incl. `office`; department filter removed) |
| `getMonthlySummary(month)` ✅ | month: yyyy-MM | `MonthlySummary[]` (present/late/absent/leave + hours) |
| `getLateReport(filter)` ✅ | filter | `AttendanceReportRow[]` (status late) |
| `getAbsentReport(filter)` ✅ | filter | `AttendanceReportRow[]` (status absent) |
| `getLeaveReport(filter)` ✅ | filter | `LeaveReportRow[]` |
| `getOvertimeReport(filter)` ✅ | filter | `OvertimeReportRow[]` (workingHours > 8) |
| `exportCsv(filename, rows)` ✅ | Blob (via `downloadCSV`, frontend-only) |
| `exportExcel(type, filter)` | string | Blob (planned) |

## 14. announcement.service.ts
| Method | Params | Returns |
|--------|--------|---------|
| `getActive()` ✅ | — | `Announcement[]` (current date within start/end) |
| `getAll()` ✅ | — | `Announcement[]` (date-sorted desc) |
| `create(data, createdBy)` ✅ | `{ title, description, priority, startDate, endDate }` | `Announcement` |
| `update(id, data)` ✅ | id | `Announcement` |
| `remove(id)` ✅ | id | `void` |

## 15. permission.service.ts
| Method | Params | Returns |
|--------|--------|---------|
| `getPermissions()` ✅ | — | `Permission[]` (full catalogue) |
| `getRoles()` ✅ | — | `Role_[]` with current permission sets |
| `updateRolePermissions(roleId, permissionIds)` ✅ | roleId, string[] | `Role_` |
| `hasPermission(roleId, permissionId)` ✅ | roleId (sync) | `boolean` — Admin always `true`; Manager/Employee resolved from in-memory role store |

**Role sets:** MANAGER now includes `reports.export` (drives Reports CSV Export button visibility on the manager's `/team/reports` page).

## 16. usePermission hook (`src/hooks/usePermission.ts`)
| Signature | Behavior |
|-----------|----------|
| `usePermission(permissionId: string): boolean` | Subscribes to `auth.user.role` and calls `permissionService.hasPermission` synchronously (defaults to `Role.EMPLOYEE`) |

## 17. Backend RBAC API (`Attendance Management-backend`)
| Endpoint | Method | Guard | Request | Response (`data`) |
|----------|--------|-------|---------|-------------------|
| `/rbac/permissions` | GET | `@Roles('ADMIN')` | — | `Permission[]` (14 entries: `{ id, name, module, action, description }`) |
| `/rbac/roles` | GET | `@Roles('ADMIN')` | — | `Role_[],{ id: 'ADMIN'\|'MANAGER'\|'EMPLOYEE', name, description, permissions: string[], isSystem: true }[]` |
| `/rbac/roles/:role/permissions` | PATCH | `@Roles('ADMIN')` + `@Permissions('settings.manage')` | `{ permissionIds: string[] }` | Updated `Role_` object; **ADMIN role rejected (403)**; unknown permission ids rejected (400) |
| Role filter on `GET /employees` | — | existing guards | `?role=admin\|manager\|employee` | Employees filtered by `User.role` |

**Note:** The backend returns role `id` as uppercase (`ADMIN`/`MANAGER`/`EMPLOYEE`, Prisma `Role` enum). `rbac.api.ts` normalizes it to the FE `Role` enum via `toRole()` (lowercase) so matrix keys in `RolesPage` align with `Role.ADMIN` etc. PATCH path params are uppercased server-side, so lowercase ids are safe to send.

## 18. Attendance history range + manager scope + statsMonth (Session 2026-09-15)
| Endpoint | Guard | Params | Behavior (`data`) |
|----------|-------|--------|-------------------|
| `GET /attendance/history` | any role | `employeeId` (EMP code or UUID), `from`/`to` optional (yyyy-MM-dd, inclusive) | History filtered to range. MANAGER viewer: only own + direct reports (403 `FORBIDDEN` otherwise); ADMIN/EMPLOYEE unchanged |
| `GET /employees` | any role | `statsMonth` optional (yyyy-MM) | Each row gains `attendanceStats { month, present, late, absent, leave, workingHours, today: { status, checkIn } \| null }`. MANAGER viewer: forced to `managerId = ownEmployeeId` (direct reports only) |
| `GET /reports/*` | ADMIN; MANAGER-supported | existing filters | MANAGER viewer scoped to direct reports + self (`viewerScope` merged into every report query); ADMIN unscoped. `getOvertimeReport` delegates to attendance report |

`attendanceStats.today` is **derived** by `ReportsService.getTodayStatuses` (not a raw lookup): if a today attendance record exists → its lowercased `AttendanceStatus` + `checkIn`; else if an APPROVED leave covers today → `"leave"`; else if today is Sunday or a public holiday → `null` (FE renders "—"); else → `"absent"` (immediate — matches admin dashboard `absentToday = total − present − onLeave`). Attendance rows store `date` at UTC midnight, so `where: { date: todayDay }` equality matches real records. Do not duplicate this derivation logic in FE — trust `attendanceStats.today.status`. Stats rely on backend `ReportsService.computeMonthlySummaries` (source of truth) — do not duplicate month-summary math in FE components.

---

## Mock Data Requirements (§46)
- 30+ employees across departments/teams/offices/shifts, with managers
- Departments, designations, teams, offices (Delhi/Mumbai/Bangalore), shifts
- Attendance records, leaves, holidays, notifications, announcements
- All in `src/mocks/data/*.ts` — never inside components

## Error Model
Typed errors to differentiate (§52): `NetworkError`, `LocationError`, `PermissionError`, `ApiError`, `ValidationError`.

## Backend Final Validation (§64)
Mock check-in endpoint deliberately simulates the backend decision (radius/state/duplicate checks). Frontend geolocation is UX-only.

---

## 17. Master Backend REST API Specification & Prompt
For building the production REST API backend (Node.js/Express/Prisma/PostgreSQL) and generating its backend memory bank (`backend-memory-bank/`), see [`BACKEND_PROMPT.md`](file:///c:/webetechies/others/Attendance%20Management/BACKEND_PROMPT.md) in the project root directory. It contains full route, request, response, error schema, database model, and multi-phase implementation prompt specifications matching all frontend service contracts.