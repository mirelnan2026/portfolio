import { toMonthIndex, type YearMonth } from "../values/year-month";

/** A length of time in whole years and months, e.g. 3 years and 8 months. */
export interface Duration {
  years: number;
  months: number;
}

/**
 * Number of months in a period, counting both the first and the last month,
 * as CVs do: March 2023 – October 2026 is 44 months.
 */
export function monthsBetween(start: YearMonth, end: YearMonth): number {
  const months = toMonthIndex(end) - toMonthIndex(start) + 1;
  if (months < 1) {
    throw new RangeError(`Period ends ("${end}") before it starts ("${start}")`);
  }
  return months;
}

/** Splits a number of months into years and months: 44 → 3 years, 8 months. */
export function toDuration(totalMonths: number): Duration {
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
}

function plural(count: number, unit: string): string {
  return `${String(count)} ${unit}${count === 1 ? "" : "s"}`;
}

/** "3 years 8 months", "1 year", "5 months". */
export function formatDuration({ years, months }: Duration): string {
  const parts: string[] = [];
  if (years > 0) parts.push(plural(years, "year"));
  if (months > 0) parts.push(plural(months, "month"));
  return parts.join(" ");
}
