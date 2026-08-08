# Sprint 2 — Categories, Transactions & Budget Context

**Status:** Complete

---

## Overview

Sprint 2 delivered full CRUD for Categories and Transactions (backend + mobile), user-scoped data isolation via a global JWT guard, and the budget context card shown when logging an expense against a budgeted category. This is the first sprint where the app writes real financial data.

---

## Deliverables

### Backend (NestJS)

**Categories CRUD** — `apps/api/src/categories/`
- `GET /categories` (filter by `type`), `GET /categories/:id`, `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id`
- All queries scoped to `userId`; soft delete via `deletedAt` (history preserved)

**Transactions CRUD** — `apps/api/src/transactions/`
- `GET /transactions` (query filters: `type`, `categoryId`, `from`, `to`, `page`, `limit`), `GET /transactions/:id`, `POST /transactions`, `PATCH /transactions/:id`, `DELETE /transactions/:id`
- **Type enforcement:** a transaction's `type` must match its category's `type`; mismatch returns `422` (enforced in `create`, `update`, and `categoryId` changes)
- **Budget sync:** every transaction write recalibrates the linked budget's `spentAmount` and `status` inside a Prisma `$transaction` block (DRAFT ↔ ACTIVE ↔ OVER_BUDGET transitions, bidirectional)

**Budget context** — `apps/api/src/budgets/`
- `GET /budgets?categoryId=<id>&periodMonth=<YYYY-MM>` returns the matching budget (or `null`) for the authenticated user; `periodMonth` defaults to the current month
- Reuses the existing unique constraint `[userId, categoryId, periodMonth]`

**Data isolation fix** — `apps/api/src/app.module.ts`
- `JwtAuthGuard` is now registered as a global `APP_GUARD`. Previously controllers lacked guards, so `@CurrentUser('id')` was `undefined` and Prisma ignored the `where.userId` — returning **all** users' data
- Routes decorated with `@Public()` (auth endpoints, `GET /health`) bypass the guard via a Reflector

### Mobile (Expo)

**Transaction list** — `app/(protected)/(transactions)/index.tsx`
- Date-grouped transaction cards (ScrollView), filter pills (All / Income / Expense), amount colored by type, full date under amount, empty state

**Add / Edit transaction** — `app/add-transaction.tsx`, `app/(protected)/(transactions)/[id].tsx`
- Amount, type toggle (EXPENSE/INCOME), category picker (bottom sheet, filtered by type), date display, notes
- Category `type` is read-only when editing; mismatched category choices are filtered out of the picker
- Save button disabled while pending; API errors surface via Alert

**Category management** — `app/(protected)/(Profile)/categories.tsx`, `app/(protected)/(Profile)/category/[id].tsx`
- Category list grouped by type, detail screen for viewing/editing/deleting

**Budget context card** — `app/add-transaction.tsx`
- When an EXPENSE category with a budget is selected, shows Allocated / Spent / Remaining, a progress bar, and a status badge (red "OVER BUDGET" when spent > allocated)

**Shared**
- `src/api/` — axios clients for categories, transactions, budgets
- `src/Components/EmptyState.tsx`, `src/Components/CTAbutton.tsx` (new `disabled` prop)
- `src/utils/formatDate.ts`, `src/utils/formatCurrency.ts`

---

## Endpoints Added

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | List user's categories (filter: `type`) |
| GET | `/categories/:id` | Category detail |
| POST | `/categories` | Create category |
| PATCH | `/categories/:id` | Update category |
| DELETE | `/categories/:id` | Soft-delete category |
| GET | `/transactions` | List transactions (filters, pagination) |
| GET | `/transactions/:id` | Transaction detail |
| POST | `/transactions` | Create transaction (type must match category) |
| PATCH | `/transactions/:id` | Update transaction |
| DELETE | `/transactions/:id` | Delete transaction |
| GET | `/budgets?categoryId=&periodMonth=` | Budget for a category/period or `null` |

All endpoints above require a Bearer token.

---

## Bugs Fixed

- **Cross-user data leak** — missing guards on categories/transactions/budgets controllers exposed every user's records; fixed with a global `JwtAuthGuard`
- **Empty transaction list** — `TransactionsService.findAll` returned a `{ data }` object that was double-wrapped by the response interceptor, breaking the client's `Array.isArray` check; services now return raw arrays

---

## What's NOT Done (Sprint 3)

- Dashboard / Home screen with analytics
- Budgets list and set-budget flow (create, edit, allocate)
- Budget creation UI (budget context card renders only when a budget already exists)
- Profile menu screen, settings, insights
- Category creation UI in the app
- Interactive date picker (date field currently displays today)

---

## Build & Verification

- `npm run build` (api) and `npx tsc --noEmit` (mobile) pass with 0 errors
