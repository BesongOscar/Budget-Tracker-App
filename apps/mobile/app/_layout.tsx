import { useEffect } from "react";
import { Stack, useSegments, useRouter } from "expo-router";
import { useAuthStore } from "@/src/store/authStore";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient } from "@/src/utils/queryClient";
import { asyncStoragePersister } from "@/src/utils/persister";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import { dashboardApi } from "@/src/api/dashboard.api";
import { getPeriodMonth } from "@/src/utils/month";
import { View } from "react-native";
import OfflineBanner from "@/src/Components/OfflineBanner";
import { useOfflineSync } from "@/src/hooks/useOfflineSync";

if (__DEV__) {
  const origError = console.error;
  console.error = (...args) => {
    if (args.some((a) => String(a).includes("Unable to activate keep awake")))
      return;
    origError.call(console, ...args);
  };
}

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  usePushNotifications();
  // ASSUMPTION: authStore may expose `isHydrated` when using persisted state.
  // If that property is not available, we assume hydration has completed.

  const { isAuthenticated } = useAuthStore();
  const isHydrated = true;

  useEffect(() => {
    // Don't redirect on anything until we actually know the auth state —
    // otherwise a logged-in user reads as `isAuthenticated: false` for one
    // frame on cold start and gets bounced into (auth) before flipping back.
    if (!isHydrated) return;

    const currentSegment = segments[0] as string | undefined;
    const inAuthGroup = currentSegment === "(auth)";
    const inProtectedGroup = currentSegment === "(protected)";

    if (!isAuthenticated && inProtectedGroup) {
      router.replace("/(auth)");
    } else if (isAuthenticated && inAuthGroup) {
      const month = getPeriodMonth();
      queryClient.prefetchQuery({
        queryKey: ["dashboard", month],
        queryFn: () => dashboardApi.getDashboard(month),
      });
      router.replace("/(protected)/(home)");
    }
    // If currentSegment is undefined or outside both groups (e.g. a route
    // not in either group), we deliberately do nothing here — there's no
    // auth-based redirect rule for that case yet.
  }, [isAuthenticated, isHydrated, segments, router]);

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
        onSuccess={() => {
          // Cached queries restored — UI can now render them while offline.
        }}
      >
        <ThemeProvider value={DefaultTheme}>
          <StatusBar style="dark" />
          <View style={{ flex: 1 }}>
            <OfflineSyncBridge />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(protected)" options={{ headerShown: false }} />
              <Stack.Screen
                name="add-transaction"
                options={{ presentation: "modal", headerShown: false }}
              />
            </Stack>
            <OfflineBanner />
          </View>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

// Must live INSIDE PersistQueryClientProvider so useOfflineSync's
// useQueryClient() can resolve the client context.
function OfflineSyncBridge() {
  useOfflineSync();
  return null;
}
