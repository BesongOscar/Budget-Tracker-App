# Push Notification Verification — Production (Sprint 6, task 6.15)

Verify all **3 push conditions** end-to-end in the production environment: budget at 80%, budget exceeded (100%), and over-allocation (once per period).

## Prerequisites

1. Production EAS build installed on the device and **signed in**.
2. Push token registered — `PATCH /users/me/push-token` already fired on login (check Profile → Settings → test push). Send the test push first and confirm it arrives.
3. A fresh **throwaway** production user (each run of the scenario is destructive — it spends a lot).
4. `scripts/smoke-sprint3.ps1` available (it paces requests at 13 s to respect the 5 req/min rate limit).

## Run the scenario

From the repo root, against production:

```powershell
.\scripts\smoke-sprint3.ps1 -Email "you@example.com" -Password "YourPass1" -BaseUrl "https://budget-tracker-api-7f17.onrender.com/api/v1"
```

Watch the device while the script runs. It logs in, seeds income, creates a budget at 60% of income, then crosses 80% and 100% with fresh expenses. The script prints when each push *should* fire.

| # | Condition | Trigger in scenario | Expected notification | Seen on device |
|---|-----------|---------------------|-----------------------|----------------|
| 1 | THRESHOLD_80 | expense 4900 on 6000 budget (crosses 4800 = 80%) | "Budget almost reached" | ☐ |
| 2 | OVER_BUDGET | next expense 1200 (spend 6100 > 6000) | "Budget exceeded" | ☐ |
| 3 | Over-allocation | allocate more than total income for the month | "Over-allocation warning" — fires **exactly once**, even if allocation is raised again | ☐ |

## Once-per-period check (condition 3)

After the warning fires once, run a second over-allocation write (raise another allocated amount so total allocated still exceeds income). **No second banner** may appear in the same calendar month. To re-test, use a new month (or a new account).

## Failure handling checks

- If any notification is missing, dump `http://localhost`… no — check the API logs on Render (secrets are never logged). Confirm:
  - `User.expoPushToken` was saved on login (`GET /users/me`).
  - The push service never fails the API request: an Expo outage returns 200 to the client and logs the failure.

## Cleanup

Delete the throwaway user's data or the user entirely after verification so the test data never appears in real reports.