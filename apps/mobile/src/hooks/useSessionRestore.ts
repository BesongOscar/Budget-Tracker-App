import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "@/src/store/authStore";
import { authApi } from "@/src/api/api";

export function useSessionRestore() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      let refreshToken: string | null = null;
      try {
        refreshToken = await SecureStore.getItemAsync("refreshToken");
      } catch {
        refreshToken = null;
      }
      if (!mounted) return;

      if (!refreshToken) {
        setIsReady(true);
        return;
      }

      try {
        const res = await authApi.refresh(refreshToken);
        const { user, accessToken, refreshToken: newRefreshToken } =
          res.data.data;
        if (!mounted) return;
        useAuthStore.getState().setAuth(user, accessToken);
        await SecureStore.setItemAsync("refreshToken", newRefreshToken);
      } catch {
        if (mounted) {
          try {
            await SecureStore.deleteItemAsync("refreshToken");
          } catch {
            // ignore — worst case an expired token is cleared on next boot
          }
        }
      } finally {
        if (mounted) setIsReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { isReady };
}