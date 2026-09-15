# React Query Cache-Key Audit (Sprint 6, task 6.10)

**Goal:** confirm no unnecessary refetches occur on Expo Router tab navigation.

## Global client config — `apps/mobile/src/utils/queryClient.ts`

| Setting | Value | Impact on tab navigation |
|---------|-------|--------------------------|
| `staleTime` | 5 minutes | Cache reused for 5 min → no network refetch on tab switch |
| `gcTime` | 30 minutes | Tab screens stay mounted in the Tabs/Stack navigator, so queries are never garbage-collected while active |
| `retry` | 2 | Only affects failed requests |
| `refetchOnWindowFocus` | `false` | No refetch when the app regains focus |

Additionally, the whole cache is persisted to AsyncStorage (`src/utils/persister.ts`) and restored on cold start, and the dashboard is prefetched in the root layout's auth-redirect effect.

React Query defaults that matter here and were **not** overridden:
- `refetchOnMount` defaults to `true` but only triggers when data is **stale**. With a 5-min `staleTime` and fresh tabs, remounting a tab does not refetch.
- `refetchOnReconnect` defaults to `true`, but Expo Router keeps screen components mounted inside the navigators, so switching tabs does not mount/unmount and therefore does not hit these hooks.

## Query keys in use

| Key shape | Writer / owner | Ever invalidated? |
|-----------|----------------|-------------------|
| `["dashboard", month]` | dashboard, analytics, insights, root prefetch | `invalidateQueries(["dashboard"])` after transaction writes |
| `["budgets", month]` | budgets list | `invalidateQueries(["budgets"])` after budget/transaction mutation |
| `["budget", id]` / `["budget", categoryId, month]` | budget detail | `invalidateQueries(["budget"])` |
| `["transactions"]` / `["transactions", {type, limit}]` | transaction list | `invalidateQueries(["transactions"])` after writes + offline replay |
| `["transaction", id]` | transaction detail | `invalidateQueries(["transaction", id])` on edit |
| `["categories"]` / `["categories", type]` / `["categories", "EXPENSE"]` | category pickers | `invalidateQueries(["categories"])` after category mutation + offline replay |
| `["category", id]` | category edit | `invalidateQueries(["category", id])` |
| `["analytics", "by-category" | "trend" | "daily", period]` | analytics screen | none (read-only; 5-min staleness acceptable) |

## Findings

1. **Tab navigation triggers no refetches.** The `(protected)` shell is an Expo Router `Tabs` navigator with per-tab `Stack` navigators. Screens stay mounted, so their `useQuery` hooks are not re-invoked and the default `refetchOnMount` never fires on a tab switch. On the rare remount (e.g., after a deep link), the 5-minute `staleTime` still prevents a network call unless the entry is stale.

2. **Query keys are consistent between readers and invalidators.** Every screen reads under the same prefix (or the prefix its mutator invalidates):
   - Budget screens read `["budgets", month]` / `["budget", …]` and all budget mutations invalidate `["budgets"]` + `["budget"]`. ✅
   - Transaction writes invalidate `["transactions"]` + `["dashboard"]` + `["budgets"]` + `["budget"]`. ✅
   - Category mutations invalidate `["categories"]` + `["category", id]`. ✅
   - Note: `["category", id]` is invalidated but nothing uses `setQueryData` to seed it — a minor inconsistency, no unnecessary refetch. ✅

3. **Manual `refetch` is user-initiated only.** The pull-to-refresh in transaction list (`index.tsx:33`) and other screens calls `refetch()` explicitly; these are intentional.

4. **`enabled:` guards** in `add-transaction.tsx:119`, `[id].tsx:33/41`, `set-budget.tsx:46`, `budgets/[id].tsx:63` prevent querying with empty/undefined ids — no wasted requests.

5. **Offline replay invalidates all five relevant prefixes** (`useOfflineSync.ts:46-50`), so queued writes refresh every dependent screen exactly once on reconnect. Recommended and correct.

## Conclusion

**No unnecessary refetches on Expo Router tab navigation.** The existing cache configuration (5-min `staleTime`, 30-min `gcTime`, `refetchOnWindowFocus: false`, persisted + prefetched dashboard) fully satisfies the "no unnecessary refetches on tab navigation" requirement. No code changes required.