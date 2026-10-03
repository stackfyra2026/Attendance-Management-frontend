# AttendFlow — Development Process

## Development Commands

```bash
# Start dev server (port 3000, auto-opens browser)
npm run dev

# Type check + production build
npm run build

# Preview production build
npm run preview

# Type check only (no build)
npx tsc --noEmit
```

## Workflow

### FEATURES.md — Mandatory Sync Rule (§59)
1. Read `FEATURES.md` before starting any module.
2. Determine: Current Module / Next Module / Remaining Features.
3. After implementing: update completed items to `[x]`, current work to `[~]`, add newly discovered requirements, mark blocked items `[!]`.
4. Update "Current Development" (module, status, next module, last updated).
5. Never remove previously completed features. Keep the file synchronized with the actual codebase.
6. Do not randomly jump between modules.

### Module Development Process (§60) — 15 steps
1. Read `FEATURES.md`
2. Understand existing architecture (check `memory-bank/03-system-patterns.md`, `04-tech-context.md`)
3. Plan the module (files, components, dependencies)
4. Implement UI
5. Implement mock service (`src/services/*.service.ts` + `src/mocks/data/`)
6. Implement Redux state (where required)
7. Implement validation (Zod schemas + React Hook Form)
8. Implement responsive behavior
9. Add loading state
10. Add empty state
11. Add error state
12. Test navigation
13. Test mobile
14. Test desktop
15. Update `FEATURES.md`

### UI Quality Check (§61)
Before a module is complete, verify at: Mobile 360/390/414px, Tablet 768px, Desktop 1024/1280/1440px.
Check: no horizontal scrolling, buttons/inputs usable, bottom nav + sidebar work, cards/tables/modals/bottom-sheets responsive, dark mode, loading/empty/error states, accessibility.

### Mobile UX Rules (§62)
Prefer: cards, bottom sheets, sticky actions, large buttons, short forms, compact headers, progressive disclosure.
Avoid: huge tables, dense layouts, tiny buttons, long forms, horizontal scrolling, complex desktop navigation.

### Admin UX Rules (§63)
Prefer: tables, filters, search, bulk actions, pagination, charts, statistics, side panels, dialogs.
Everything must still work on mobile (table → cards, modal → bottom sheet, multi-column → single).

### Code Quality Rules (§65)
- Strict TypeScript — no `any`
- Small components, reusable components, custom hooks, service layer, typed API models, semantic HTML, clear naming, no unnecessary duplication
- No API calls inside JSX — always in services or thunks
- No mock data inside components — `src/mocks/data/`
- No hardcoded coordinates, radius, colors, or app names in components
- All form validation via React Hook Form + Zod
- Loading, empty, and error states on every data-driven page
- Accessibility: semantic HTML, keyboard nav, focus states, ARIA labels, 44px touch targets, statuses never color-only

### Commit Strategy
- One commit per completed phase/module
- Commit message format: `feat: complete Phase X — [module name]`
- Verify build passes before committing

## Phase Sequence
Current: Phase 1 complete. Next: Phase 2.

| Phase | Module | Status |
|-------|--------|--------|
| 1 | Foundation + Application Shell | ✅ Complete (tsc clean) |
| 2 | Check-in/Out Flow + Location Services | **Next** |
| 3 | Attendance Module (History, Monthly, Working Hours, Breaks) | Planned |
| 4 | Leave Management (Balance, Apply, History) | Planned |
| 5 | Profile + Notifications | Planned |
| 6 | Admin Dashboard (Stats, Charts) | Planned |
| 7 | Employee Management (CRUD, Details, Import) | Planned |
| 8 | Admin Organization (Corrections, Departments, Designations, Teams) | Planned |
| 9 | Shifts, Office Locations, Google Maps, Holidays | Planned |
| 10 | Reports + Employee Import Wizard | Planned |
| 11 | Announcements + Roles & Permissions | Planned |
| 12 | Manager Views (/team*) | Planned |
| 13 | Dark Mode Polish + PWA (manifest, install) | Planned |

## Spec Compliance Checklist
- [ ] §11 full route map wired (reset-password, /employees/:id*, /attendance/corrections, /settings/roles, /settings/permissions, /team*)
- [ ] §44 all listed components exist
- [ ] §45 14 flat services in `src/services/`
- [ ] §46 mock data 30+ employees in `src/mocks/data/`, none inside components
- [ ] §48 all listed types, no `any`
- [ ] §49 Redux only for global state; forms use local state
- [ ] §54 dark mode light/dark/system persisted
- [ ] §56 PWA manifest + installable mobile experience
- [ ] §64 frontend location validation UX-only; mock API simulates backend final validation