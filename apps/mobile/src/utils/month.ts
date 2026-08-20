export function getPeriodMonth(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftPeriodMonth(periodMonth: string, delta: number): string {
  const [y, m] = periodMonth.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatPeriodMonth(periodMonth: string): string {
  const [y, m] = periodMonth.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function getPeriodDateRange(periodMonth: string): {
  from: string;
  to: string;
} {
  const [y, m] = periodMonth.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}
