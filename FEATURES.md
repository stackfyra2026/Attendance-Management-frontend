# AttendFlow Features

## Status Legend

- [ ] Planned
- [~] In Progress
- [x] Completed
- [!] Blocked

---

# Authentication

- [x] Login UI
- [x] Mock authentication (email + password; demo password `password`)
- [x] Role-based routing
- [x] Multi-role login — role picker shown after sign-in when account has >1 roles
- [x] Switch role without re-login (top bar)
- [x] Forgot password UI
- [ ] Reset password
- [ ] Real API authentication

---

# Employee Management

- [x] Employee list
- [x] Employee search
- [x] Employee filtering (department, team, office, manager, employment status)
- [x] Employee details
- [x] Add employee
- [x] Edit employee
- [x] Employee deactivate
- [ ] Employee documents
- [ ] Employee activity
- [x] Employee import

---

# Attendance

- [x] Employee attendance dashboard
- [x] Check-in UI
- [x] Check-out UI
- [x] Location permission handling
- [x] Distance calculation
- [x] 500m radius validation
- [x] Attendance history
- [x] Monthly attendance
- [x] Working hours
- [x] Break management
- [x] Attendance correction API
- [x] Backend attendance validation (mock simulates server-side final validation)

---

# Location

- [x] Browser geolocation
- [x] Distance calculation
- [x] Location status UI
- [x] Outside radius state
- [x] Permission denied state
- [x] Google Maps integration (isolated; fallback ready)
- [x] Office location management
- [x] Configurable radius

---

# Leave Management

- [x] Leave dashboard
- [x] Leave balance
- [x] Apply leave
- [x] Leave history
- [ ] Leave approval (admin phase)
- [ ] Leave rejection (admin phase)
- [x] Leave cancellation (pending requests)
- [x] Leave API (mock service)

---

# Organization

- [x] Departments
- [x] Designations
- [x] Teams
- [x] Managers
- [ ] Organization hierarchy

---

# Shift Management

- [x] Shift list
- [x] Shift details
- [x] Shift creation
- [x] Shift editing
- [x] Shift assignment
- [x] Multiple shifts

---

# Office Locations

- [x] Office list
- [x] Add office
- [x] Edit office
- [x] Google Maps
- [x] Radius configuration

---

# Holidays

- [x] Holiday calendar
- [x] Add holiday
- [x] Edit holiday
- [x] Delete holiday
- [ ] Recurring holidays

---

# Notifications

- [x] Notification list
- [x] Read/unread UI
- [x] Unread count
- [x] Notification API (mock service)
- [x] Mark all as read API (mock service)
- [x] Mark single as read (tap notification)

---

# Announcements

- [x] Announcement UI
- [x] Create announcement
- [x] Edit announcement
- [x] Delete announcement

---

# Reports

- [x] Report dashboard
- [x] Filters
- [x] Attendance report
- [x] Monthly summary report
- [x] Late report
- [x] Absent report
- [x] Leave report
- [x] Overtime report
- [x] CSV export
- [ ] Excel export (planned)

---

# Roles & Permissions

- [x] Role UI
- [x] Permission matrix
- [x] Permission API (mock service)
- [x] Dynamic authorization

---

# UI/UX

- [x] Mobile-first layout
- [x] Mobile bottom navigation
- [x] Desktop sidebar
- [x] Dark mode
- [x] Responsive design
- [x] Loading states
- [x] Empty states
- [x] Error states
- [x] Toasts
- [x] Accessibility
- [ ] PWA installation testing

---

# Technical

- [x] TypeScript
- [x] Tailwind CSS v4
- [x] React Router
- [x] Redux Toolkit
- [x] Service architecture
- [x] Mock API
- [ ] Production API integration
- [ ] API error handling
- [ ] Authentication integration

---

# Current Development

## Current Module

Phase 11: Announcements + Roles & Permissions (§42-43) — HR role + all HR content removed; TopBar role-switch QA wiring added

## Current Status

Completed (verified `tsc` + `build`)

## Next Module

Phase 12: Manager /team/* Views (§35)

## Last Updated

2026-09-11
