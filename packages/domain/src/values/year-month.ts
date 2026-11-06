import { z } from "zod";

const YEAR_MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

/**
 * A calendar month in ISO format, e.g. "2023-03".
 * The CV has month precision, so periods are stored and compared by month.
 */
export const yearMonthSchema = z.string().regex(YEAR_MONTH, "Expected a month as YYYY-MM");

export type YearMonth = z.infer<typeof yearMonthSchema>;

/**
 * Months since January of year 0 (like converting hours:minutes to minutes),
 * so two months can be compared or subtracted.
 */
export function toMonthIndex(value: YearMonth): number {
  const match = YEAR_MONTH.exec(value);
  if (!match) {
    throw new RangeError(`Invalid year-month: "${value}" (expected YYYY-MM)`);
  }
  const [, year, month] = match;
  return Number(year) * 12 + Number(month) - 1;
}

/** The calendar month of a date, in UTC, e.g. 2026-11-05 → "2026-11". */
export function toYearMonth(date: Date): YearMonth {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${String(date.getUTCFullYear())}-${month}`;
}
