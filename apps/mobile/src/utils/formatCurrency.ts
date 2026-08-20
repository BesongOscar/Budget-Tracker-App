import { useAuthStore } from "@/src/store/authStore";

const formatters: Record<string, Intl.NumberFormat> = {};

export function formatCurrency(
  amount: number,
  currencyCode?: string,
): string {
  const code =
    currencyCode ??
    useAuthStore.getState().user?.currencyCode ??
    "USD";
  if (!formatters[code]) {
    formatters[code] = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
    });
  }
  return formatters[code].format(amount);
}
