# AttendFlow — Project Brief

## Project Name
AttendFlow — Employee & Attendance Management Application

## Overview
A complete, production-quality **Employee Management + Attendance Management** frontend application built as a modern responsive web app. The employee experience feels like a native mobile app, while the HR/Admin experience works as a powerful desktop SaaS dashboard.

## Core Requirements
- Two connected experiences: Employee (mobile-first) and HR/Admin (desktop SaaS dashboard)
- Check-in/out with browser geolocation + configurable radius validation (default 500m)
- Full attendance lifecycle: check-in, breaks, check-out, history, monthly view
- Leave management: balance, apply, history, approval workflow
- Employee CRUD with multi-section forms
- Admin dashboard with charts and statistics
- Organization management: departments, designations, teams, shifts, locations
- Reports with CSV export (frontend-generated mock CSV; Excel planned)
- Roles & permissions system (permission matrix)
- Manager experience: team dashboard, team attendance, team leave
- Dark mode support
- PWA-ready employee experience (installable on mobile) — manifest, app icons, theme color, mobile viewport, safe-area support
- Google Maps integration — isolated component with clean fallback when no API key / unavailable

## Technology Stack
- React 19+ / TypeScript / Vite 8
- Tailwind CSS v4 (CSS-first `@theme` configuration)
- React Router 7 / Redux Toolkit / React Redux
- Axios / React Hook Form / Zod / Lucide React
- Recharts / date-fns
- Do not introduce unnecessary libraries

## Constraints
- Frontend only — no backend or database
- Mock services with clean architecture for future API integration
- `VITE_USE_MOCK_API` flag switches between mock and real API
- All coordinates, radius, colors, and names must be configurable — never hardcoded in components
- Frontend geolocation validation is UX/helper validation ONLY — never treated as final security authority (backend will perform final verification of user, coordinates, office, radius, timestamp, attendance state, device/session, duplicate check-in, check-out validity)
- Never commit Google Maps API keys (`VITE_GOOGLE_MAPS_API_KEY`)

## Locale
- Indian locale: Indian names, Indian cities (Delhi, Mumbai, Bangalore), Indian holidays
- Currency: INR
- Time: 12-hour format (AM/PM)

## Design Principles
- Modern mobile-first UI — employee side feels like a native app
- Premium SaaS dashboard for admin
- Bottom navigation on mobile, collapsible sidebar on desktop
- CSS variables for semantic design tokens (no arbitrary hex colors)
- Semantic tokens: primary, secondary, success, warning, danger, background, surface, surface-muted, text, text-muted, border
- Inter font with consistent typography hierarchy (Display/H1/H2/H3/Body/Small/Caption/Label)
- Rounded cards, subtle shadows, minimal borders, clean spacing
- 44px minimum touch targets, keyboard accessible, accessibility (semantic HTML, ARIA, focus states, contrast)
- Statuses never conveyed by color alone — always icon + text + color
- Responsive breakpoints tested at: 360, 375, 390, 414, 480, 768, 1024, 1280, 1440px; no horizontal scrolling

## Spec Reference
Full product specification (67 sections) drives all modules. Key section map:
- §13-20 Employee dashboard, check-in flow, location service, 500m rule, location UI, break management, check-out
- §21-25 Attendance history, monthly view, leave, profile, notifications
- §26-34 Admin dashboard, employee management, add/edit employee, details, corrections, departments, designations, teams
- §35 Manager experience
- §36-43 Shifts, locations, Google Maps, holidays, reports, import, announcements, roles & permissions
- §44-47 Components, service architecture, mock data, mock API switch
- §48-55 Types, Redux, loading/empty/error states, toasts, dark mode, accessibility
- §56-57 PWA + folder structure
- §64 Security architecture note (backend final validation)
