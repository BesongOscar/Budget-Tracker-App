# Sprint 4 — Analytics & Income-First Dashboard

**Period:** August 2026
**Status:** Complete — All phases delivered. Backend and mobile compile clean.

---

## Overview

Sprint 4 delivers analytics endpoints and a full income-first dashboard. The backend gains two new NestJS modules (Analytics + Dashboard) with six endpoints for spending breakdowns, monthly trends, and a composite dashboard payload. The mobile app replaces stub screens with a data-driven dashboard (hero balance card, period summary, budget progress bars, recent transactions, greeting), a full analytics screen with donut and bar charts, and an insights screen with three alert types. React Query cache prefetch ensures instant dashboard load on cold start.

---

## Deliverables

### Phase 1–2 — Backend (complete)

**Analytics module** — `apps/api/src/analytics/`
- `GET /analytics/summary` — income vs expense totals for a given period
  - Query params: `periodMonth` (`YYYY-MM`, defaults to current month)
  - Returns `{ period, totalIncome, totalExpenses, netBalance }`
- `GET /analytics/by-category` — spending per expense category for a period
  - Returns `{ period, categories: [...], grandTotal }` where each category includes `categoryId`, `categoryName`, `icon`, `color`, `totalSpent`, `transactionCount`, `percentage`
- `GET /analytics/trend` — monthly totals for last N months
  - Query params: `months` (2–12, defaults to 6)
  - Returns array of `{ periodMonth, income, expenses, netBalance }`

**Dashboard module** — `apps/api/src/dashboard/`
- `GET /dashboard` — full income-first payload for a period
  - Query params: `periodMonth` (`YYYY-MM`, defaults to current month)
  - Returns `DashboardData` matching the shared type:
    - `period`, `income`, `allocated`, `spent`, `balance` (all-time), `remainingToAllocate`, `isOverAllocated`
    - `budgetProgress[]` — per-category budget progress with `categoryId`, `categoryName`, `icon`, `colorHex`, `allocated`, `spent`, `remaining`, `percentUsed`, `status`
    - `recentTransactions[]` — last 5 transactions with category included
  - **balance ≠ remainingToAllocate**: balance is all-time `SUM(income) - SUM(expenses)`; remainingToAllocate is period-scoped `income - allocated`

**Schema** — no migration changes (all queries use existing models)

### Phase 3 — Mobile Dependencies

- `react-native-gifted-charts` — donut (PieChart) and bar charts
- `react-native-linear-gradient` — peer dependency
- `react-native-svg` — peer dependency

### Phase 4–5 — Mobile Screens (complete)

**Dashboard** — `app/(protected)/(home)/index.tsx`
- Time-based greeting ("Good morning/afternoon/evening, {firstName} 👋")
- `BalanceCard` — hero card showing all-time balance
- `PeriodSummaryCards` — 3-column row: Income | Allocated | Spent
- `BudgetProgressBars` — per-category budget progress with icons and progress bars
- `RecentTransactions` — last 5 transactions with category icon, description, date, amount
- "View Analytics" link card navigating to the analytics sub-route
- Data fetched via `GET /dashboard` with React Query

**Analytics** — `app/(protected)/(home)/analytics.tsx`
- Period picker with left/right month navigation
- Summary card showing total spent with % change vs previous month
- Donut chart (PieChart) showing spending by expense category with legend
- Daily spending bar chart grouped by day of month
- Empty state when no expense data

**Insights** — `app/(protected)/(Profile)/insights.tsx`
- Three alert types derived from dashboard data:
  - **Over-Allocation** (red) — when `isOverAllocated === true`
  - **Over Budget** (red) — when `spent > allocated` for any budget
  - **Nearing Limit** (orange) — when `percentUsed >= 80` for any budget
- Empty state: "All Clear — No alerts" with green checkmark

**Reusable components:**
- `apps/mobile/src/Components/Dashboard/` — BalanceCard, PeriodSummaryCards, RemainingIndicator, BudgetProgressBars, RecentTransactions
- `apps/mobile/src/Components/Analytics/PeriodPicker.tsx`
- `apps/mobile/src/Components/Insights/AlertCard.tsx`

**API clients:**
- `apps/mobile/src/api/analytics.api.ts` — getSummary, getByCategory, getTrend
- `apps/mobile/src/api/dashboard.api.ts` — getDashboard

### Phase 6 — Cache Prefetch (complete)

- Dashboard query prefetched on auth redirect in `app/_layout.tsx`
- Uses `queryClient.prefetchQuery` to warm `["dashboard", currentMonth]` before the screen mounts
- Existing `PersistQueryClientProvider` + AsyncStorage persister handles cold-start cache restoration automatically

---

## Endpoints Added

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/summary` | Income vs expense totals for a period |
| GET | `/analytics/by-category` | Spending breakdown by expense category |
| GET `/analytics/trend` | Monthly income/expense totals for last N months |
| GET | `/dashboard` | Full income-first dashboard payload |

All endpoints above require a Bearer token.

---

## What's NOT Done (deferred / optional)

- **Real-device cache timing verification** — confirm dashboard renders from cache in <3s on a physical device
- **Daily analytics endpoint** — the daily bar chart currently groups expense transactions client-side; a dedicated `GET /analytics/daily` endpoint could improve performance for months with many transactions

---

## Build & Verification

- `npx nest build` passes with 0 errors in `apps/api`
- `npx tsc --noEmit` passes with 0 errors in `apps/mobile`
- Backend adds 4 new endpoints (total: 31)
- Mobile adds 16 new files, modifies 5 existing files
