import { useCurrencyStore } from "@/src/store/currencyStore";
import { useAuthStore } from "@/src/store/authStore";

const formatters: Record<string, Intl.NumberFormat> = {};

// Non-hook variant used outside components (e.g. in async/event handlers) —
// still stays in sync because the store code is set on every login/profile save.
export function getCurrencyCode(): string {
  return (
    useAuthStore.getState().user?.currencyCode ||
    useCurrencyStore.getState().currencyCode ||
    "USD"
  );
}

export function formatCurrencyForCode(amount: number, code: string): string {
  if (!formatters[code]) {
    formatters[code] = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
    });
  }
  return formatters[code].format(amount);
}

// Hook-based formatter so components re-render when currency changes.
export function useFormatCurrency(amount: number): string {
  const authCode = useAuthStore((s) => s.user?.currencyCode);
  const storeCode = useCurrencyStore((s) => s.currencyCode);
  const code = authCode || storeCode || "USD";
  return formatCurrencyForCode(amount, code);
}

// Backwards-compatible named export used across screens; now reactive because
// the caller must subscribe via the hook variant. We keep the plain function
// for non-render contexts.
export function formatCurrency(amount: number, currencyCode?: string): string {
  return formatCurrencyForCode(amount, currencyCode ?? getCurrencyCode());
}
