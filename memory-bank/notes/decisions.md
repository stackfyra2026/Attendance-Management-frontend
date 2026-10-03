# Architecture & Design Decisions

## D1: Location Validation (UX-only)
**Decision**: Frontend location validation is UX/helper validation only, NOT the final security authority.
**Date**: 2026-09-11
**Rationale**: Backend must eventually verify user, coordinates, office, radius, timestamp, attendance state, device/session, duplicate check-in, check-out validity.
**Implementation**: Frontend calculates distance with Haversine, shows UX states, then calls mock API that simulates backend final validation.

## D2: Tailwind CSS v4 (CSS-first)
**Decision**: Use Tailwind CSS v4 with `@import "tailwindcss"` and `@theme` blocks.
**Date**: 2026-09-11
**Rationale**: No tailwind.config.js needed; all tokens defined in CSS. Matches modern Tailwind v4.
**Implementation**: `src/index.css` has all `@theme` color blocks + CSS variable overrides for `:root` and `.dark`.

## D3: Indian Locale Mock Data
**Decision**: All mock data uses Indian names, cities, holidays, and INR formatting.
**Date**: 2026-09-11
**Rationale**: Product spec references "Rahul" and Delhi; user confirmed Indian locale.
**Implementation**: Delhi/Mumbai/Bangalore offices, Indian names, Indian holidays (Diwali, Holi, Ganesh Chaturthi, etc.)

## D4: Inline Mock Data → Service Layer Migration (Phase 2+)
**Decision**: Phase 1 pages use inline mock data as placeholder; Phase 2+ will move to mock services.
**Date**: 2026-09-11
**Rationale**: Design requirement: "Do not put API calls directly inside UI components" and "Do not place mock data inside components."
**Implementation**: Create `src/mocks/data/*.ts` files + `src/services/*.service.ts` with mock/real switch.

## D5: Radius Default 500m (Config-driven)
**Decision**: Default attendance radius is 500m, stored in office config, NOT hardcoded.
**Date**: 2026-09-11
**Rationale**: Admin should be able to configure radius; design explicitly forbids hardcoding.
**Implementation**: `OfficeLocation.radiusMeters` field; `config.defaultOfficeRadius = 500`.

## D6: Timer Implementation (Client-side)
**Decision**: Working hours and break timers run client-side with `setInterval`, synced on check-out.
**Date**: 2026-09-11
**Rationale**: Frontend-only project; persistent timer would require backend. Client-side timer provides the UX.
**Implementation**: Redux attendanceSlice tracks checkInTime, breakStatus, and increments minutes.

## D7: TypeScript Strict + noUncheckedIndexedAccess
**Decision**: Full strict mode including `noUncheckedIndexedAccess`.
**Date**: 2026-09-11
**Rationale**: Higher type safety; array access may return undefined (requires narrowing).
**Impact**: Use `arr[0]!` for known-present indices; careful destructuring of mock data.

## D8: Flat Service Layer Structure
**Decision**: All services live flat in `src/services/*.service.ts`.
**Date**: 2026-09-11
**Rationale**: Spec §15 says `src/services/location/` but §45 lists `location.service.ts`. Flat naming matches §45, is consistent with every other service file, and keeps imports simple. The geolocation wrapper is a single module; no need for a subdirectory yet.
**Implementation**: `src/services/location.service.ts` (not `src/services/location/`). Documented in 07-api-documentation.md.

## D9: LocationVerification — 7 States (per §17)
**Decision**: LocationVerification supports 7 states, not 5 (earlier plan assumed 5).
**Date**: 2026-09-11
**States**: checking, verified, outside, permission denied, unavailable, low accuracy, error.
**Rationale**: Spec §17 explicitly enumerates these states.
**Implementation**: `LocationVerification` in `src/components/location/` renders each state with icon, message, distance, allowed radius, accuracy, and action buttons.

## D10: Google Maps Isolation + Fallback
**Decision**: `GoogleMap` is the only component aware of Maps; app must never break when Maps is unavailable.
**Date**: 2026-09-11
**Rationale**: Spec §38 — no API key committed, clean fallback required.
**Implementation**: `VITE_GOOGLE_MAPS_API_KEY` read from config. If empty/unavailable, render coordinate/static fallback (office marker + distance shown textually) instead of failing.

## D11: Mock API Simulates Backend Final Validation
**Decision**: Check-in/out API responses are mocked but reproduce the backend's final-decision semantics.
**Date**: 2026-09-11
**Rationale**: Spec §64 — frontend geolocation is UX-only; structure must allow later real backend to do final checks (user, coords, office, radius, timestamp, attendance state, device/session, duplicate check-in, check-out validity).
**Implementation**: `attendanceService.checkIn()` rejects when outside the configured radius so the UI proves the full flow (UX verification → mock backend decision).

## D12: WhatsApp Teal Primary Theme
**Decision**: Primary color changed from indigo to WhatsApp brand teal `#00A884` (500); darker `#075E54` (700) for gradients/hover. Scope: **primary color only** — light/dark backgrounds and other tokens unchanged.
**Date**: 2026-09-11
**Rationale**: User requested "theme color like WhatsApp". Teal `#00A884` chosen over bright green `#25D366` (professional SaaS feel, better contrast) and dark teal `#075E54` (too dark for button fill).
**Implementation**: `src/index.css` only. `@theme` `--color-primary-50..950` → teal-green scale; `:root` `--primary` rgb(0 168 132), `--primary-hover` rgb(0 148 122); `.dark` `--primary` rgb(51 201 160), `--primary-hover` rgb(94 216 179), dark `--primary-text` retained. White on `#00A884` ≈ 3.0:1 (WCAG AA for large text/UI components). `success` token kept green (`#16a34a`) — still distinct from teal in status badges. All component color usage flows through tokens; no hardcoded hex.

## D13: Timers Derived from Timestamps (useNow tick)
**Decision**: Working/Break timers never dispatch Redux ticks. Components derive elapsed time from stored timestamps (`checkIn`, `breakStartedAt`, `breakMinutes`) plus a local `useNow` hook that ticks every second.
**Date**: 2026-09-11
**Rationale**: Keeps store stable (no 1Hz churn), timers survive re-renders, and the same derivation runs in the check-out thunk for the authoritative total. Supersedes the D6 `setInterval`-accumulation sketch.
**Implementation**: `src/hooks/useNow.ts` + `getWorkingMinutes()` in `src/utils/date.ts`, used by `WorkingTimer`, `BreakTimer`, `CheckOutSheet`, and `attendanceSlice.checkOut`.

## D14: Low-Accuracy Threshold from Config
**Decision**: GPS "low accuracy" cutoff and geolocation options live in `config.location`, not hardcoded in components.
**Date**: 2026-09-11
**Rationale**: §17 requires a low-accuracy state; threshold must be tunable without touching components.
**Implementation**: `config.location = { highAccuracy: true, maxAccuracyMeters: 100, timeoutMs: 10000 }`; `isLowAccuracyAccuracy(accuracy)` compares against `maxAccuracyMeters`. `location.service.getCurrentPosition` reads options from config.