# Manual QA Checklist (Sprint 6, task 6.6)

Run on **physical iOS and Android devices** against the production API. Work through every feature story below. Record PASS/FAIL per device. Anything that fails goes back into the backlog for a fix.

- App build under test: production EAS build (or Expo Go with `.env` pointing at production while a dev build is pending).
- Test user: use a fresh throwaway account (email + password) per device run so data isolation is guaranteed.
- Baseline: `GET /api/v1/health` returns `ok` before starting.

| # | User story / feature | Steps | Expected result | iOS | Android |
|---|----------------------|-------|-----------------|-----|---------|
| 1 | Onboarding | Fresh install → swipe through 3 slides | Carousel auto-advances, CTA takes you to login | ☐ | ☐ |
| 2 | Register + email verification | Fill register form (name, email, valid password) → submit → enter 6-digit code from email | Account created, verification success modal, redirected into the app | ☐ | ☐ |
| 3 | Login / logout | Login with credentials → open Profile → Sign out | Session ends, returns to auth; re-login works | ☐ | ☐ |
| 4 | Password reset | Forgot password → enter email → enter code from email → new password → login with new password | Reset email received, login works with new password | ☐ | ☐ |
| 5 | Categories seeded | After registration go to Profile → Categories | 6 default categories (3 income, 3 expense) present, grouped by type | ☐ | ☐ |
| 6 | Category CRUD | Create a category (name + type) → edit it → delete it | Appears under its type, edit persists, delete confirms then removes; deleting a category with transactions is blocked server-side | ☐ | ☐ |
| 7 | Add income transaction | FAB → amount, type INCOME, pick income category, today | Appears in transaction list (+), dashboard income increases, budget pool increases | ☐ | ☐ |
| 8 | Add expense transaction | FAB → amount, type EXPENSE, pick expense category | Appears in list (−), dashboard spent increases | ☐ | ☐ |
| 9 | Edit transaction | Open a transaction → change amount/date/notes → save | All fields persist; dashboard figures update | ☐ | ☐ |
| 10 | Delete transaction | Open a transaction → delete → confirm | Removed from list; dashboard/budget figures adjust | ☐ | ☐ |
| 11 | Type enforcement on device | In Add Transaction pick an income category, then switch type to EXPENSE | Category picker filters by type; mismatched combinations impossible from UI; server returns 422 if bypassed | ☐ | ☐ |
| 12 | Budget allocation | Budgets tab → Set Budget → pick expense category, allocate amount from pool | Budget card shows allocated; allocation summary updates; remaining-to-allocate decreases | ☐ | ☐ |
| 13 | Budget progress | Add expenses against a budget | Card shows spent, remaining, progress bar, status badge | ☐ | ☐ |
| 14 | Copy period | Budgets tab → copy previous month | New month gets budgets with 0 spent, DRAFT status | ☐ | ☐ |
| 15 | Over-budget state | Spend more than allocated | Card turns red OVER BUDGET; insights alert appears | ☐ | ☐ |
| 16 | Dashboard figures | See task 6.7 known data section below | balance, remainingToAllocate, spent match the seeded values | ☐ | ☐ |
| 17 | Dashboard budget progress | Allocate + spend in a category | Progress bars reflect the same numbers as the budgets screen | ☐ | ☐ |
| 18 | Analytics | Insights/Analytics tabs → view donut, daily bar, trend | Charts render with correct numbers; month switcher updates them | ☐ | ☐ |
| 19 | Insights alerts | Create 80%-threshold and over-budget budgets | 80% and OVER BUDGET alerts appear with severity colors | ☐ | ☐ |
| 20 | Offline write queue | Airplane mode → add a transaction → reconnect | App shows offline banner; write is queued and syncs on reconnect, refresh reflects it | ☐ | ☐ |
| 21 | Reactive currency | Settings → change currency | Every screen's currency formatting updates instantly | ☐ | ☐ |
| 22 | Push notification registration | Fresh login → check Profile settings | Push token registered (Settings shows token enabled); test push arrives | ☐ | ☐ |
| 23 | Pull-to-refresh | Swipe down on dashboard/list | Data refreshes with the tail indicator | ☐ | ☐ |
| 24 | Empty + error states | Delete all transactions; kill network then open a screen | Empty states render; error states with retry render | ☐ | ☐ |

## Task 6.7 — dashboard figures with known test data

Verify on each device open. With exactly this data:

| Input | Value |
|-------|-------|
| INCOME transaction | 3000 |
| EXPENSE transaction | 200 |
| Budget allocated | 2500 |

| Figure | Expected | iOS | Android |
|--------|----------|-----|---------|
| Income (period) | 3000 | ☐ | ☐ |
| Spent (period) | 200 | ☐ | ☐ |
| Remaining to allocate | 500 | ☐ | ☐ |
| Balance (all-time) | 2800 | ☐ | ☐ |

The same values are asserted automatically in `apps/api/test/dashboard.e2e-spec.ts`.