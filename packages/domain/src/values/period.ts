import { z } from "zod";
import { toMonthIndex, yearMonthSchema } from "./year-month";

/**
 * A span of months, e.g. March 2023 – October 2026. Both months are included.
 * `end` is null while the period is ongoing.
 */
export const periodSchema = z
  .strictObject({
    start: yearMonthSchema,
    end: yearMonthSchema.nullable(),
  })
  .refine(
    (period) => period.end === null || toMonthIndex(period.end) >= toMonthIndex(period.start),
    {
      message: "end must not be before start",
      path: ["end"],
      // Compare only well-formed months: zod still runs this rule after a field has failed.
      when: (payload) => payload.issues.length === 0,
    },
  );

export type Period = z.infer<typeof periodSchema>;

/** Whether `inner` lies entirely within `outer`. An ongoing period (end = null) has no upper limit. */
export function isWithin(inner: Period, outer: Period): boolean {
  const startsInside = toMonthIndex(inner.start) >= toMonthIndex(outer.start);
  if (outer.end === null) {
    return startsInside;
  }
  return startsInside && inner.end !== null && toMonthIndex(inner.end) <= toMonthIndex(outer.end);
}
