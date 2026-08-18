import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "@/src/store/authStore";
import { usersApi } from "@/src/api/users.api";

const TOKEN_KEY = "expoPushTokenRegistered";
const PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let registrationPromise: Promise<void> | null = null;

async function registerForPushNotifications() {
  if (Platform.OS === "web") return;
  if (!PROJECT_ID) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let status = existingStatus;
  if (existingStatus !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const alreadyRegistered = await SecureStore.getItemAsync(TOKEN_KEY);
  if (alreadyRegistered === "done") return;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: PROJECT_ID,
  });
  if (!token?.data) return;

  await usersApi.updatePushToken(token.data);
  await SecureStore.setItemAsync(TOKEN_KEY, "done");
}

export function usePushNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (registrationPromise) return;

    registrationPromise = registerForPushNotifications()
      .catch((error) => {
        console.log("Push registration failed", error);
      })
      .finally(() => {
        registrationPromise = null;
      });
  }, [isAuthenticated]);
}
