# Sprint 3 — Budgets & Push Notifications

**Period:** August 2026
**Status:** Complete ✅ — All phases delivered. FCM configured; smoke tests pending real-device verification.

---

## Overview

Sprint 3 delivers the full income-first budgeting experience: budget CRUD with per-month allocation summaries and status lifecycle on the backend, the complete budget management UI on the mobile app, and push notifications driven by budget events. Phases 1–2 of this sprint covered backend planning and the schema/migration work for the income-first budget model (`BudgetPeriod`). Phases 3–4 implemented and typechecked the backend and mobile code. Phase 5 — verifying the push flow end-to-end on a real Android EAS dev build — is deferred.

---

## Deliverables

### Phase 3 — Backend (complete)

**Budgets CRUD** — `apps/api/src/budgets/`
- `GET /budgets` — list budgets for a period with an aggregated summary
  - Query params: `month`/`periodMonth` (`YYYY-MM`, defaults to current month), `status`, `categoryId`
  - Returns `{ budgets, summary }` where `summary = { income, allocated, remainingToAllocate, isOverAllocated }`
  - Only non-deleted EXPENSE categories are included
- `GET /budgets/:id` — budget detail with category
- `POST /budgets` — create a budget for an expense category + period (`allocatedAmount` optional, defaults 0, starts `DRAFT`); income categories rejected (`422`)
- `PATCH /budgets/:id` — update `allocatedAmount` only; re-evaluates spend status and fires threshold/over-budget events
- `DELETE /budgets/:id` — only `DRAFT`/`ARCHIVED` budgets are deletable; `ACTIVE`/`OVER_BUDGET`/`COMPLETED` return `409`
- `POST /budgets/copy-period` — copy a month's budgets to another month (`fromMonth`, `toMonth`), resetting `spentAmount` to 0 and status to `DRAFT` (upsert semantics)

**Status lifecycle** — `recalculateSpent`
- Evaluated server-side inside Prisma `$transaction` blocks on every transaction write and budget allocation change
- `DRAFT` (no spend) → `ACTIVE` → `OVER_BUDGET` (spent > allocated) / `COMPLETED` (period ended, spend exists); `ARCHIVED` is terminal
- Transaction writes dispatch budget events **after** the transaction commits

**Push notifications** — `apps/api/src/notifications/`
- `@Global` module exporting `NotificationsService` (`sendPush`, `notifyBudgetEvents`, `notifyOverAllocation`)
- Sends via Expo's push API (`https://exp.host/--/api/v2/push/send`, overridable with `EXPO_PUSH_ENDPOINT`), `sound: "default"`
- Expo send failures are logged and swallowed; `DeviceNotRegistered`/`InvalidCredentials` null out `User.expoPushToken`

**Notification events:**

| Event | Trigger | Push title |
|-------|---------|------------|
| `THRESHOLD_80` | spend crosses 80% of allocation | "Budget almost reached" |
| `OVER_BUDGET` | spend crosses 100% of allocation | "Budget exceeded" |
| Over-allocation | total allocated > total income for a period | "Over-allocation warning" |

- Over-allocation warnings fire **once per period** (tracked via `BudgetPeriod.overAllocationWarnedAt`)
- Budget events fire only when spend **crosses** the threshold/limit (not on every write)

**Push-token endpoints** — `apps/api/src/users/`
- `PATCH /users/me/push-token` — store the Expo push token (validated against `^(ExponentPushToken|ExpoPushToken)\[[\w-]+\]$`)
- `DELETE /users/me/push-token` — clear the token
- `POST /users/me/push-token/test` — send a test push (`404` if no token registered, `502` if Expo rejects)

**Schema changes** — `apps/api/prisma/migrations/20260808020923_budget_period/`
- New `BudgetPeriod` model (`userId_periodMonth` unique): `totalIncome`, `totalAllocated`, `overAllocationWarnedAt`
- `User.expoPushToken` added; `Budget` indexes on `[userId, periodMonth]` and `[status]`

### Phase 4 — Mobile (complete)

**Budgets UI** — `apps/mobile/app/(protected)/(budgets)/`
- `index.tsx` — monthly overview with month navigation, allocation summary card, over-allocation banner, end-of-period copy prompt, `BudgetCard` list, and a "Set Budget" FAB
- `[id].tsx` — budget detail with hero, stats, edit allocation, and delete (only enabled for `DRAFT`/`ARCHIVED`)
- `set-budget.tsx` — modal to create a budget: category picker excludes already-budgeted categories, shows remaining-to-allocate preview, and a copy-prev-month button
- `_layout.tsx` — registers `set-budget` with `presentation: 'modal'`

**Reusable components** — `apps/mobile/src/Components/Budget/`
- `AllocationSummaryCard.tsx`, `OverAllocationBanner.tsx`, `EndOfPeriodPrompt.tsx`, `BudgetCard.tsx`

**Dashboard** — `app/(protected)/(home)/index.tsx`
- Renders the allocation summary card + over-allocation banner and a "Manage budgets" link, sharing the `["budgets", month]` query key with the budgets overview

**Push notifications** — `apps/mobile/src/hooks/usePushNotifications.ts`
- Requests permission, creates the Android `default` channel, obtains the Expo push token via `getExpoPushTokenAsync({ projectId })`
- Registers the token with `PATCH /users/me/push-token` once (guarded by a SecureStore flag, module-level coalescing promise)
- Foreground handler shows an in-app banner + list entry (no sound/badge); `app.json` registers the `expo-notifications` plugin
- `expo-notifications ~0.32.17` added; `src/api/users.api.ts` client added

**Utilities** — `src/utils/month.ts` (`getPeriodMonth`/`shiftPeriodMonth`/`formatPeriodMonth`), `src/types/budget.ts`; `formatCurrency` now reads the user's `currencyCode` from the auth store (fallback `USD`)

---

## Endpoints Added

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/budgets` | List budgets + summary for a period |
| GET | `/budgets/:id` | Budget detail |
| POST | `/budgets` | Create budget (expense category only) |
| PATCH | `/budgets/:id` | Update allocated amount |
| DELETE | `/budgets/:id` | Delete (DRAFT/ARCHIVED only) |
| POST | `/budgets/copy-period` | Copy a month's budgets to another month |
| PATCH | `/users/me/push-token` | Register Expo push token |
| DELETE | `/users/me/push-token` | Remove push token |
| POST | `/users/me/push-token/test` | Send test push |

All endpoints above require a Bearer token.

---

## What's NOT Done (deferred / optional)

- **Runtime smoke tests** — full scenario pass (80% threshold, over-budget, over-allocation, copy-period, status transitions, invalid-token clearing) on a real device with a registered token; rate limit (5 req/min) requires ~13s spacing between API calls. Script: `scripts/smoke-sprint3.ps1`
- **Verification-driven doc updates** — anything discovered during smoke testing

---

## Build & Verification

- `npx tsc --noEmit` passes with 0 errors in both `apps/api` and `apps/mobile`
- API healthy at `GET /api/v1/health` (returns `ok`)
- `npm run lint` in `apps/api` fails on a pre-existing ESLint 9 flat-config issue (no `eslint.config.js`); not caused by this sprint
- Expo push token registration was validated in Expo Go; FCM configured with `google-services.json`
