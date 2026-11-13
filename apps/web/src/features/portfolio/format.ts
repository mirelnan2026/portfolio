import type { Experience, Period, YearMonth } from "@mirelnan/domain";
import { formatDuration, monthsBetween, toDuration } from "@mirelnan/domain";

/** "2023–2024", "2024" when it starts and ends in the same year, "2025–present" while it is ongoing. */
export function yearRange(period: Period): string {
  const start = period.start.slice(0, 4);
  const end = period.end === null ? "present" : period.end.slice(0, 4);
  return start === end ? start : `${start}–${end}`;
}

/** "3 years 8 months"; an ongoing period counts up to `currentMonth`. */
export function durationLabel(period: Period, currentMonth: YearMonth): string {
  return formatDuration(toDuration(monthsBetween(period.start, period.end ?? currentMonth)));
}

const employmentTypes = { "full-time": "Full-time", contract: "Contract", freelance: "Freelance" };
const workModes = { remote: "Remote", hybrid: "Hybrid", "on-site": "On-site" };

/** "JWP Connatix · Contract · Remote", "CN Group · Full-time · Hybrid · Bucharest, Romania". */
export function employmentLine(experience: Experience): string {
  return [
    experience.company,
    employmentTypes[experience.employmentType],
    experience.workMode === null ? null : workModes[experience.workMode],
    experience.workMode === "remote" ? null : experience.location,
  ]
    .filter((part) => part !== null)
    .join(" · ");
}

/**
 * A skill's time in whole years, never rounded up: 123 months → "10+ yrs", read as "over 10 years".
 * `text` is the compact visible label; `spoken` is what a screen reader says instead.
 */
export function tenureLabel(months: number): { text: string; spoken: string } {
  const years = Math.floor(months / 12);
  if (years === 0) {
    return { text: "<1 yr", spoken: "under a year" };
  }
  const unit = years === 1 ? "yr" : "yrs";
  const word = years === 1 ? "year" : "years";
  return months % 12 === 0
    ? { text: `${String(years)} ${unit}`, spoken: `${String(years)} ${word}` }
    : { text: `${String(years)}+ ${unit}`, spoken: `over ${String(years)} ${word}` };
}
