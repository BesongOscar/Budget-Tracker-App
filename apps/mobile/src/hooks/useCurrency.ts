import { useCurrencyStore } from "@/src/store/currencyStore";
import { useAuthStore } from "@/src/store/authStore";

export function useCurrency() {
  const storeCode = useCurrencyStore((s) => s.currencyCode);
  // Fall back to the authStore's persisted code if the currency store
  // hasn't been synced yet (e.g. cold start).
  const authUser = useAuthStore((s) => s.user);
  const code = authUser?.currencyCode || storeCode || "USD";
  return code;
}
