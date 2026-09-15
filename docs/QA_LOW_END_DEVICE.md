# Low-End Android Performance QA (Sprint 6, task 6.8)

Target: **2GB RAM Android device**. Verify the two performance budgets:

- **Launch:** dashboard renders within **3 seconds** of a cold start.
- **API:** every endpoint responds in **under 500 ms** against the production API.

## How to measure

### Cold launch (3 s target)

1. Force-quit the app (`adb shell am force-stop com.<app-id>`).
2. `adb shell am start -W -n com.<app-id>/.MainActivity` writes `TotalTime` (ms). That is your launch figure. Repeat 3× and take the median.
3. Alternative in-app: enable the Metro/JS dev menu Performance monitor; a cold start of the production build has no dev menu, so prefer the ADB timing.
4. The dashboard should paint from the React Query **persisted cache** + the auth-redirect **prefetch** — a cold display does not require the network. If the dashboard shows skeletons for the full 3 s, the prefetch/cache path is not working.

### API latency (500 ms target)

1. Run the backend e2e numbers or, against production, time each call from the device:
   - `GET /dashboard`
   - `GET /transactions`
   - `GET /budgets?month=`
   - `GET /analytics/summary`
2. Use React Query DevTools (dev build) network timings, or `adb logcat` network logs, or a proxy. Anything above 500 ms on a warm device in the same region is a red flag.

## What to watch on a 2 GB device

- **Memory pressure / background kills** — navigate all 4 tabs, open Add Transaction, return; the process must not restart (if it does, the launch budget is hit on every tab switch).
- **Reanimated animation jank** — onboarding carousel and tab bar animations should hold 60 fps; drop the visualizer if frames are missed.
- **JS bundle size** — keep the initial bundle lean; the dashboard prefetch means the hero numbers appear before charts.
- **Offline queues** — with a low-RAM device, the persisted outbox and query cache are restored from AsyncStorage; verify no flash of empty screens during hydration.

## Sign-off

| Check | iOS device | Android 2 GB device |
|-------|-----------|---------------------|
| Cold launch to dashboard < 3 s | ☐ | ☐ |
| All endpoints < 500 ms | ☐ | ☐ |
| Tab switching without process kill | ☐ | ☐ |
| No jarring animation jank | ☐ | ☐ |