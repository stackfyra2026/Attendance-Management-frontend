# AttendFlow — Product Context

## Why This Exists
Companies need a modern, mobile-friendly attendance management system that replaces outdated biometric/paper-based systems. Employees want a self-service experience (check-in, view attendance, apply leave) from their phones, while HR/Admins need a comprehensive dashboard to manage the entire workforce.

## Problems Solved
1. **Manual attendance tracking** → Automated check-in/out with location verification
2. **Leave management chaos** → Structured leave balance, application, and approval workflow
3. **No visibility** → Real-time dashboards for admins, personal dashboards for employees
4. **Multiple tools** → Single application for attendance, leave, employee management, and reports
5. **Office location verification** → Geolocation-based validation ensures employees are on-site

## User Experiences

### Employee (Mobile-first)
- Login → Dashboard → Check In (location verified) → Working timer → Break → Check Out
- View attendance history (cards on mobile)
- Monthly calendar view with status indicators
- Apply leave, view balance and status
- View notifications, profile, announcements
- One-handed usability, large touch targets, bottom navigation

### HR/Admin (Desktop SaaS)
- Login → Admin Dashboard with charts and statistics
- Manage employees (list, search, filter, add, edit, import wizard)
- Manage departments, designations, teams, shifts, locations, holidays
- View and correct attendance (with required reason + audit info), approve/reject leave
- Generate reports with filters and CSV export
- Manage announcements, roles, and permissions (permission matrix)
- Sidebar navigation, tables, modals, data density

### Manager (Desktop/Mobile hybrid)
- Route group: `/team`, `/team/attendance`, `/team/leave`
- Can only see their own team in mock data
- Team dashboard: team size, present, absent, late, on leave
- All manager views work on mobile too

## Success Metrics
- All routes functional with working navigation (full route map per spec §11, incl. reset-password, employee detail routes, attendance corrections, roles/permissions)
- Check-in/out flow works with browser geolocation (UX validation only; mock API simulates backend final validation)
- Forms validate properly with React Hook Form + Zod
- Mobile UI feels like a native app (bottom nav, cards, bottom sheets)
- Desktop UI feels like a premium SaaS product
- Dark mode works correctly (light / dark / system, persisted)
- No TypeScript errors in build
- Final experience (§66): Employee: Login → Dashboard → Check In → Location Verification → Within radius → Check In Success → Working Timer → Break → Resume → Check Out → Attendance Summary. HR: Login → Admin Dashboard → Employees → Add Employee → Organization → Attendance → Leave → Reports.
