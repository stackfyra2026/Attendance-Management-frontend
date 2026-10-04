# AttendFlow Frontend Implementation Plan & Progress Tracking

## Overview
This plan outlines the frontend API implementation, reusable UI components, and screen development for AttendFlow HRMS, connecting to the NestJS + Prisma backend APIs.

---

## 1. Backend API Mapping & Integration Matrix

| Module | Backend Controller | Frontend Service API | Status |
| :--- | :--- | :--- | :--- |
| **Auth** | `AuthController` | `src/services/api/auth.api.ts` | Completed |
| **Employees** | `EmployeesController` | `src/services/api/employee.api.ts` | Completed |
| **Attendance** | `AttendanceController` | `src/services/api/attendance.api.ts` | Completed |
| **Leaves** | `LeavesController` | `src/services/api/leave.api.ts` | Completed |
| **Org (Shifts, Locations, Holidays)** | `OrgController` | `src/services/api/org.api.ts` | Completed |
| **Org (Departments)** | `OrgController` | `src/services/api/department.api.ts` | Pending |
| **Documents** | `DocumentsController` | `src/services/api/document.api.ts` | Pending |
| **Company Policies** | `PoliciesController` | `src/services/api/policy.api.ts` | Pending |
| **Expenses** | `ExpensesController` | `src/services/api/expense.api.ts` | Pending |
| **Payroll & Payslips** | `PayrollController` | `src/services/api/payroll.api.ts` | Pending |
| **Announcements** | `AnnouncementsController` | `src/services/api/announcement.api.ts` | Completed |
| **Notifications** | `NotificationsController` | `src/services/api/notification.api.ts` | Completed |
| **RBAC** | `RbacController` | `src/services/api/rbac.api.ts` | Completed |
| **Reports** | `ReportsController` | `src/services/api/report.api.ts` | Completed |

---

## 2. Reusable Component Strategy (DRY Architecture)

To eliminate code duplication across pages, we are introducing/refactoring key reusable components:

1. **`StatusBadge`**: Standardised status indicator for all domain statuses (Attendance, Leave, Expense, Policy, Payroll, Document).
2. **`PageHeader`**: Unified page title, subtitle, breadcrumb, and primary action button container.
3. **`FilterBar`**: Shared search input + filter dropdowns bar.
4. **`DocumentUploader`**: Reusable file picker modal supporting drop/file input with progress and category selection.

---

## 3. Tasks & Progress Checklist

### Phase 1: Planning & Setup
- [x] Analyze backend modules, Prisma schema, and controller endpoints
- [x] Create `plan.md` in frontend root

### Phase 2: API Endpoints & Services Integration
- [x] Add endpoints to `src/services/http/endpoints.ts` (departments, documents, policies, expenses, payroll)
- [x] Check `src/services/api/department.api.ts` (Integrated via `org.api.ts`)
- [x] Create `src/services/api/document.api.ts` (Document list, upload, download, delete)
- [x] Create `src/services/api/policy.api.ts` (Policies list, acknowledge, create, publish, archive)
- [x] Create `src/services/api/expense.api.ts` (Expense claim submit, list, approve, reject, reimburse)
- [x] Create `src/services/api/payroll.api.ts` (Salary structures, payroll runs, payslips)

### Phase 3: Shared Reusable UI Components
- [x] Create `src/components/ui/StatusBadge.tsx`
- [x] Create `src/components/ui/PageHeader.tsx`
- [x] Create `src/components/ui/FilterBar.tsx`
- [x] Create `src/components/ui/DocumentUploader.tsx`

### Phase 4: Screens Implementation
- [x] Implement `DepartmentsPage.tsx` (Admin department list, modal add/edit, manager selection)
- [x] Implement `DocumentsPage.tsx` (Employee my-documents + Admin tenant documents)
- [x] Implement `CompanyPoliciesPage.tsx` (Employee handbook with 1-click acknowledge + Admin policy publisher)
- [x] Implement `ExpensesPage.tsx` (Employee expense claim submission & status list + Admin approval queue)
- [x] Implement `PayrollPage.tsx` & `PayslipsPage.tsx` (Admin payroll runs & salary structure management + Employee payslips viewer & PDF downloader)

### Phase 5: Routing & Navigation Wiring
- [x] Update `AppRouter.tsx` to register routes for Departments, Documents, Policies, Expenses, Payroll
- [x] Update `AdminLayout.tsx` and `EmployeeLayout.tsx` navigation sidebar/drawer links

### Phase 6: Verification & QA
- [x] Run TypeScript validation (`npx tsc --noEmit`)
- [x] Run Production Build (`npm run build`)
