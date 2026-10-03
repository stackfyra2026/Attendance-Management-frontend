# AttendFlow — System Patterns

## Architecture Overview

```
src/
├── app/              → Router + Layouts (shell)
├── components/       → Reusable components by domain
│   ├── ui/           → Generic UI primitives (Button, Card, Modal, etc.)
│   ├── layout/       → TopBar, AdminSidebar
│   ├── attendance/   → Check-in/out, timers, status badges
│   ├── location/     → Location verification components
│   ├── employee/     → Employee-specific components
│   ├── leave/        → Leave-specific components
│   ├── admin/        → Admin-specific components
│   ├── team/         → Team components
│   └── notifications/→ Notification components
├── pages/            → Route-level page components
│   ├── auth/         → Login, Forgot Password
│   ├── employee/     → Dashboard, Attendance, Leave, Profile, Notifications
│   ├── manager/      → Team views (future)
│   └── admin/        → Dashboard, Employees, Departments, Settings, etc.
├── services/         → API service layer (flat; mock + real), §45/D8
│   ├── auth.service.ts
│   ├── employee.service.ts
│   ├── attendance.service.ts
│   ├── location.service.ts     (browser geolocation wrapper — flat, resolves §15 vs §45)
│   ├── leave.service.ts
│   ├── department.service.ts
│   ├── designation.service.ts
│   ├── team.service.ts
│   ├── shift.service.ts
│   ├── location-office.service.ts
│   ├── holiday.service.ts
│   ├── notification.service.ts
│   ├── report.service.ts
│   └── announcement.service.ts
├── store/            → Redux Toolkit store + slices
├── hooks/            → Custom hooks (useRedux)
├── utils/            → Pure utility functions
├── types/            → TypeScript interfaces and enums
├── constants/        → Labels, enums, fixed values
├── config/           → App configuration
├── mocks/            → Mock data and mock service implementations
└── assets/           → Static assets
```

## Key Patterns

### 1. Service Abstraction
- All API calls go through service files in `src/services/`
- Mock services in `src/mocks/` return realistic data
- `VITE_USE_MOCK_API` flag switches between mock and real API
- Services are typed: `attendanceService.checkIn()`, `employeeService.getAll()`, etc.

### 2. State Management (Redux Toolkit)
- Only genuinely global state goes in Redux: auth, notifications, attendance, app settings
- Local form state uses React Hook Form (NOT Redux)
- Slices: `authSlice`, `appSlice`, `notificationSlice`, `attendanceSlice` (Phase 2)
- Custom hook: `useAppSelector` and `useAppDispatch` via `src/hooks/useRedux.ts`

### 3. Component Architecture
- UI components are presentation-only, receive props, emit events
- Domain components (attendance, employee, etc.) contain business logic
- Pages compose components and connect to Redux/services
- No API calls inside JSX — always in services or thunks
- No mock data inside components — data lives in `src/mocks/data/` or services

### 4. Design System
- Tailwind CSS v4 with `@theme` blocks for color tokens
- CSS custom properties for semantic values (bg, surface, surface-muted, text, text-muted, border, primary, secondary, success, warning, danger)
- Dark mode via `.dark` class on `<html>`, toggling CSS variable values; support light / dark / system, persisted (§54)
- Custom utility classes: `bg-app`, `text-app`, `border-app`, `bg-surface`, etc.
- Statuses never conveyed by color alone — always icon + text + color (§55)

### 5. Responsive Strategy
- Mobile-first CSS; breakpoints at `sm`, `md`, `lg`, `xl`
- Verify at: 360px, 375px, 390px, 414px, 480px, 768px, 1024px, 1280px, 1440px+ (§5)
- Mobile: bottom navigation, cards, bottom sheets, filter sheets
- Desktop: sidebar, tables, modals, data density
- No JavaScript-based responsive switching — pure CSS
- Never allow unwanted horizontal scrolling

### 6. Form Pattern
- React Hook Form for all forms
- Zod schemas for validation
- `zodResolver` connects Zod to React Hook Form
- Inline error messages, loading states on submit buttons
- Forms use local state, NOT Redux

### 7. Routing
- React Router 7 with nested routes
- Layout routes: `EmployeeLayout` (bottom nav), `AdminLayout` (sidebar)
- `ProtectedRoute` wraps authenticated routes
- `RoleRoute` restricts access by role
- Route map per spec §11 (incl. /reset-password, /employees/:id*, /attendance/corrections, /settings/roles, /settings/permissions, manager /team/*)

### 8. Location Validation Flow (§64) — UX-only, NOT security
```
Frontend
  ↓ Get location (navigator.geolocation)
  ↓ Calculate distance (Haversine)
  ↓ Show UX state (verified / outside / permission denied, etc.)
  ↓ API Check-In (mock/simulated)
  ↓ Backend Final Validation (future: user, coords, office, radius, timestamp,
    attendance state, device/session, duplicate check-in, check-out validity)
```
Frontend result is displayed and used for UX; the mock API response simulates the backend's final decision.

### 9. Google Maps Isolation (§38)
- `GoogleMap` is the single component touching Maps (office marker, current location, distance, radius visualization, location selection)
- If `VITE_GOOGLE_MAPS_API_KEY` is empty or Maps fails to load → clean static/cordinate fallback; app must never break
- Never commit API keys

### 10. Toast Positioning (§53)
- Mobile: displayed above the bottom navigation
- Desktop: displayed top-right

### 11. Employee Import Wizard (§41)
- Steps: Upload → Validate → Preview → Import
- Show Total Rows / Valid / Invalid / Duplicates with row-level errors
- CSV fields: Employee ID, First Name, Last Name, Email, Phone, Department, Designation, Manager, Team, Joining Date, Office, Shift, Role

### 12. Loading / Empty / Error States (§50-52)
- Every data-driven page: loading (skeletons) + success + empty + error — never blank screens
- Reusable `EmptyState` / `ErrorState` / `Skeleton*` components
- Differentiate error types: network, location, permission, API, validation

## Data Flow

```
User Action → Component → Redux Thunk → Service (mock/API) → Redux State → Component Re-render
```

Example: Check-in flow
```
Click "Check In" → LocationVerification opens → navigator.geolocation →
calculateDistance() → if within radius → attendanceService.checkIn() →
(Mock API simulates backend final validation) → Redux state updates →
Dashboard shows timer
```
