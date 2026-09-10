# Sprint 5 — Offline Mode, Settings, and Polish

**Period:** September 2026
**Status:** Complete — All phases delivered. Backend and mobile compile clean.

---

## Overview

Sprint 5 makes the app genuinely offline-first. The backend gains profile endpoints so the mobile app can persist and edit user-level settings (name, currency). On mobile, a persisted write queue (`offlineQueueStore`) captures every transaction, category, and budget mutation (plus profile/currency changes) when the network is unavailable and replays them automatically on reconnect via `useOfflineSync`. Currency formatting becomes fully reactive through a dedicated Zustand `currencyStore` + `useCurrency` hook, so a currency change reformats every screen immediately. Finally, every screen gets consistent loading skeletons, error states, pull-to-refresh, keyboard avoidance on forms, and destructive-action confirmations.

---

## Deliverables

### Phase 1 — Backend Profile Endpoints (complete)

**Users module** — `apps/api/src/users/`
- `GET /users/me` — returns the authenticated user's profile with `passwordHash` stripped
- `PATCH /users/me` — partial update supporting `fullName` (max 120 chars) and `currencyCode` (must match `/^[A-Z]{3}$/`)
- New `UpdateProfileDto` with class-validator guards
- No Prisma migration needed (`fullName` / `currencyCode` already exist on the `User` model)

### Phase 2 — Network Awareness & Offline Banner (complete)

**`src/hooks/useNetwork.ts`** — subscribes to `@react-native-community/netinfo` and exposes `isOffline`. Treats the initial `null` state as online so the banner never flashes on cold start.

**`src/Components/OfflineBanner.tsx`** — absolute top-of-screen banner shown only while `isOffline`:

> You're offline — showing saved data. Changes are saved and will sync when you're back online.

Mounts once in `app/_layout.tsx` and auto-toggles from the NetInfo subscription.

### Phase 3 — Offline Write Queue (complete)

**`src/store/offlineQueueStore.ts`** — Zustand store with a persisted outbox (AsyncStorage key `BUDGET_TRACKER_OUTBOX`):
- Supports `transaction` / `category` / `budget` / `profile` ops with `create` / `update` / `delete` / `copy` actions
- Each entry carries `uid`, `op`, and `createdAt` so ordering and dedup are possible
- Survives app restarts via the persist middleware

**`src/hooks/useOfflineMutation.ts`** — drop-in replacement for `useMutation`:
- When online, delegates to the normal API call
- When offline, enqueues the write to the outbox and resolves immediately (sentinel `{ __queued: true }`) so `onSuccess` runs and the UI flow (e.g. `router.back()`, cache invalidation) completes as if saved

**`src/hooks/useOfflineSync.ts`** — flushes the queue when connectivity flips back online:
- Iterates the outbox in FIFO order, awaiting each API call
- Removes each op from the outbox only after it succeeds; a failed op stops the replay so ordering is never broken
- Invalidates `transactions`, `dashboard`, `budgets`, `categories` after the flush
- Wired into `app/_layout.tsx` via a small `OfflineSyncBridge` component that lives inside `PersistQueryClientProvider` (so `useQueryClient()` resolves)

**Mutation coverage (all consume `useOfflineMutation`):**
- Transactions: create (`add-transaction`), update/delete (`(transactions)/[id]`)
- Categories: delete (`categories`), update/delete (`category/[id]`)
- Budgets: create/update (`set-budget`), delete (`(budgets)/[id]`), copy-period (`budgets` overview + `set-budget`)
- Profile: name save (`(Profile)/index`) and currency change (`settings`) enqueue offline

**reads offline:** React Query's persisted cache (`PersistQueryClientProvider` + AsyncStorage persister, in place since Sprint 2) renders dashboard/transactions/analytics from cache; failed refetches keep stale data on screen.

### Phase 4 — Reactive Currency (complete)

**`src/store/currencyStore.ts`** — minimal Zustand store (`currencyCode` + `setCurrency`).

**`src/hooks/useCurrency.ts`** — returns the reactive currency code (default `USD`).

**`formatCurrency` refactor** (`src/utils/formatCurrency.ts`):
- `formatCurrencyForCode(amount, code)` — memoized `Intl.NumberFormat` per code
- `formatCurrency(value, code)` — callers pass the reactive `code` from `useCurrency()`
- `getCurrencyCode()` — non-hook read for event handlers (reads stores synchronously)
- `useFormatCurrency(amount)` — hook variant that subscribes to both stores

**Propagation:** every currency-displaying component/screen now reads `useCurrency()` and passes `code` into `formatCurrency`. `authStore.setAuth/setUser` sync the user's `currencyCode` into `currencyStore`, so login/profile-save always keeps the app-wide currency consistent.

### Phase 5 — Settings & Profile (complete)

**`app/(protected)/(Profile)/index.tsx`** — consolidated profile screen: avatar with initials, name/email card, inline edit-name form (offline-aware), currency picker, notifications (online-only test push), security, categories, help, and sign-out — all in one scroll.

**`app/(protected)/(Profile)/settings.tsx`** — separate Settings screen reachable from the Profile header gear icon (`(Profile)/_layout.tsx`), sharing the same currency/notification handlers.

**`(Profile)/_layout.tsx`** — header with a gear `headerRight`. Layout options are hoisted to module-scope constants so reference identity is stable (avoids React Navigation's inline-options infinite re-render).

### Phase 6 — Polish (complete)

- **Loading/error/empty everywhere** — reusable `LoadingSkeleton` and `ErrorState` applied to Dashboard, Transactions, Analytics, Insights, Budgets (overview + detail), Categories (list + edit) and transaction edit
- **Pull-to-refresh** — `RefreshControl` on Dashboard, TransactionList, Analytics, Insights, Budgets overview
- **Delete confirmations** — shared `confirmDelete` helper (iOS ActionSheet + Android Alert) for budgets, transactions, and categories
- **KeyboardAvoidingView** — added to `add-transaction`, `set-budget`, `(transactions)/[id]`, `category/[id]` (profile already had it)
- **Budget progress thresholds** — shared `progressColor()` (green <70%, amber 70–99%, red ≥100%) across `BudgetProgressBars`, `BudgetCard`, budget detail, and the inline budget card in `add-transaction`
- **Offline cache timestamp** — Dashboard shows when cached data was last fetched while offline

---

## Endpoints Added

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Authenticated user's profile (sanitized) |
| PATCH | `/users/me` | Update `fullName` and/or `currencyCode` |

All endpoints above require a Bearer token.

---

## What's NOT Done (deferred / optional)

- **Notification toggle is online-only** — push delivery requires the network, so the settings toggle stays a direct API call rather than joining the offline queue
- **Offline read staleness UX** — no explicit "data from cache" indicator beyond the timestamp on Dashboard; a per-screen staleness badge could be added later
- **Queue conflict resolution** — the outbox replays FIFO with a stop-on-failure; server-driven merge (e.g. latest-write-wins via `updatedAt`) is deferred
- **Currency-offline edge case** — a currency pick saved while offline reformats immediately but the outbox payload replays only `{ currencyCode }`; if a user edits their name offline too, both ops replay independently

---

## Build & Verification

- `npx tsc --noEmit` passes with 0 errors in `apps/mobile`
- `npx tsc --noEmit -p tsconfig.json` passes with 0 errors in `apps/api`
- `npx expo lint` introduces no new errors
- Backend adds 2 new endpoints (total: 33)
- Mobile adds 12 new files, modifies 27 existing files