const formatters: Record<string, Intl.NumberFormat> = {};

export function formatCurrency(
  amount: number,
  currencyCode: string = "XAF",
): string {
  if (!formatters[currencyCode]) {
    formatters[currencyCode] = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    });
  }
  return formatters[currencyCode].format(amount);
}
